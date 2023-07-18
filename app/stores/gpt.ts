import { makeAutoObservable } from "mobx";
import schema from "./schema";
import { get } from "@app/utils/http";
import rootStore from ".";
import ws from "@app/utils/websocket";
import tck from "../utils/tck";
import { safeParse } from '@app/utils/function';
import * as ngqlDoc from '@app/utils/ngql'
 
export const matchPrompt = `Generate NebulaGraph query from my question.
Use only the provided relationship types and properties in the schema.
Do not use any other relationship types or properties that are not provided.
Schema:
---
{schema}
---
Note: NebulaGraph speaks a dialect of Cypher, comparing to standard Cypher:
1. it uses double equals sign for comparison: == rather than =
2. it needs explicit label specification when referring to node properties, i.e.
v is a variable of a node, and we know its label is Foo, v.foo.name is correct
while v.name is not.
For example, see this diff between standard and NebulaGraph Cypher dialect:
diff
< MATCH (p:person)-[:directed]->(m:movie) WHERE m.name = 'The Godfather'
< RETURN p.name;
---
> MATCH (p:person)-[:directed]->(m:movie) WHERE m.movie.name == 'The Godfather'
> RETURN p.person.name;
Question:{query_str}
NebulaGraph Cypher dialect query:`;

export interface GPTConfig {
  url: string;
  apiType: string;
  gptVersion: string;
  key: string;
  features: string[];
  docLength: number;
  enableCopilot: boolean;
  enableGPT2NGQLs: boolean;
}
class GPT {
  currentInput = "";
  open = false;
  config = {
    docLength: 2000,
    enableCopilot: true,
    enableGPT2NGQLs: true,
    url: "https://{your-resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version={api-version}",
    apiType: "gpt3.5-turbo",
    gptVersion: "azure",
    features: ["spaceSchema"],
  } as GPTConfig;
  widget: HTMLSpanElement;
  editor: any;
  mode = "text2ngql" as "text2ngql" | "text2cypher";
  completionList: {text:string,type:string}[] = [];
  constructor() {
    makeAutoObservable(this, {
      editor: false,
      widget: false,
    });
    this.fetchConfig();
  }

  fetchConfig() {
    return get("/api/config/gpt")().then((res) => {
      if (res.code != 0) return;
      const { config, ...values } = res.data;
      const configMap = config?safeParse<GPTConfig>(config):{};
      this.setConfig({
        ...configMap,
        ...values,
      });
      return this.config;
    });
  }

  setConfig(payload: GPTConfig) {
    this.config = {  ...this.config,...payload, };
  }

  update(payload: any) {
    Object.assign(this, payload);
  }

  async getSpaceSchema(space: string) {
    let finalPrompt = "";
    if (space) {
      finalPrompt+="now space: ${space};";
    } 
    if (this.config.features.includes("spaceSchema")) {
      await schema.switchSpace(space);
      await schema.getTagList();
      await schema.getEdgeList();
      const tagList = schema.tagList;
      const edgeList = schema.edgeList;
      const tagsSchema = tagList
        .map((item) => {
          return `${item.name}[${item.fields
            .map((p) => p.Field + `(${p.Type})`)
            .join(",")}]`;
        })
        .join("\n");
      const edgeTypesSchema = edgeList
        .map((item) => {
          return `${item.name}[${item.fields
            .map((p) => p.Field + `(${p.Type})`)
            .join(",")}]`;
        })
        .join("\n");
      finalPrompt += ` tags:\n: ${tagsSchema} \nedges:\n ${edgeTypesSchema} \nspace vid type:"${schema.spaceVidType}"`
    }
    if (this.config.features.includes("useConsoleNGQL")) {
      finalPrompt += `user console ngql context: ${rootStore.console.currentGQL}\n`;
    }
    return finalPrompt
  }

  async getDocPrompt(text: string) {
    let prompt = matchPrompt; // default use text2cypher
    if (
      text.toLowerCase().indexOf("match") === -1 &&
      this.mode !== "text2cypher"
    ) {
      const res = (await ws.runChat({
        req: {
          temperature: 0.2,
          stream: false,
          max_tokens: 20,
          messages: [
            {
              role: "system",
              content: `Select two directories from the graph database document directory that would be most helpful in solving the user's problem, and separate them with a comma.
The graph database document directory is: ${ngqlDoc.categoryString} 
the user's problem:${text}.
The directories are:`,
            },
          ],
        },
      })) as any;
      if (res.code === 0) {
        const url = res.message.choices[0].message?.content;
        const paths = url.toLowerCase().replaceAll(" ", "").split(",");
        console.log("select doc url:", paths);
        if (ngqlDoc.ngqlMap[paths[0]]) {
          let doc = ngqlDoc.ngqlMap[paths[0]].content;
          const doc2 = ngqlDoc.ngqlMap[paths[1]].content;
          if (doc2) {
            doc += (doc2);
          }
          if (doc.length) {
            console.log("docString:", doc);
            prompt = `learn the below nGQL doc, and use it to help user ,the user space schema is "{schema}" the doc is: \n${doc.slice(0,this.config.docLength)} the question is "{query_str}"`;
          }
        }
      }
    }
    prompt = prompt.replace("{query_str}", text);
    const pathname = window.location.pathname;
    const space =
      pathname.indexOf("schema") > -1
        ? rootStore.schema.currentSpace
        : rootStore.console.currentSpace;
    if (!space) {
      return prompt.replace("{schema}", "no space selected");
    }
    const schemaPrompt = await rootStore.gpt.getSpaceSchema(space);
    prompt = prompt.replace("{schema}", schemaPrompt);
    return prompt;
  }

  timer;
  running = false;
  async checkCopilotList(cm: any) {
    clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      let snippet = "";
      const cursor = cm.getCursor();
      const line = cm.getLine(cursor.line).split(";").pop();
      if (cursor.ch < line.length - 1) return;
      if (line.length < 3) return;
      const tokens = line.split(" ");
      const firstToken = tokens.find(
        (item) => item.replaceAll(" ", "").length > 0
      );
      const hits = tck.allNGQL.filter(each=>each.toLowerCase().indexOf(firstToken.toLowerCase()) === 0)
      let doc = "";
      if (this.mode == "text2cypher" && firstToken.toLowerCase() == "match") {
        doc += matchPrompt;
      } else {
        if (hits.length) {
          hits.find((item) => {
            if (doc.length > this.config.docLength) return true;
            doc += item + "\n";
          });
        }
      }
      if (!doc) {
        return;
      }
      this.running = true;
      cm.closeHint();
      const schema = await this.getSpaceSchema(rootStore.console.currentSpace);
      const res = (await ws.runChat({
        req: {
          temperature: 1,
          stream: false,
          presence_penalty: 0.6,
          max_tokens: 30,
          messages: [
            {
              role: "user",
              content: `As a NebulaGraph NGQL code autocomplete copilot, you have access to the following information: document "${doc}" and user space schema "${schema}".
               Use this information to guess the user's next NGQL code autocomplete as accurately as possible.
               Please provide your guess as a response without any prefix words.
               Don't explain anything.
               the next autocomplete text can combine with the given text.
               if you can't guess, say "Sorry",
               The user's NGQL text is: ${line}
               the most possible  2 next autocomplete text is:`,
            },
          ],
        },
      })) as any;
      if (res.code === 0) {
        snippet = res.message.choices[0].message?.content;
        console.log(snippet);
        if (snippet.indexOf("Sorry") > -1) {
          snippet = "";
        }
      }
      if (snippet) {
        this.update({
          completionList: snippet.split("\n").map(each => ({
            type: "copilot",
            text: each
          })).filter((item) => item.text !== "")
        })
        rootStore.console.update({
          showCompletion:true
        })
      }
      this.running = false;
    }, 3000);
  }
}

export default new GPT();
