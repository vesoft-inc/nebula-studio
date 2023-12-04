import { makeAutoObservable } from 'mobx';
import schema from './schema';
import { get } from '@app/utils/http';
import rootStore from '.';
import ws from '@app/utils/websocket';
import { safeParse } from '@app/utils/function';
import * as ngqlDoc from '@app/utils/ngql';

export const matchPrompt = `Use NebulaGraph match knowledge to help me answer question.
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
`;
export const llmImportPrompt = `You are knowledge graph Expert.
please extract relationship data from the text below, referring to the schema of the graph, and return the results in the following JSON format without interpreting, don't explain just return the results directly.
{
  "nodes":[{ "name":"","type":"","props":{} }],
  "edges":[{ "src":"","dst":"","edgeType":"","props":{} }]
}
The schema of the graph is: {spaceSchema}
The text is: {text} 
The result is:
`;
export const llmImportTask = `please excute the task below,and return the result,dont' explain,just return the result directly.
{
  "task": "extract relationships",
  "instructions": {
    "text": "{text}",
    "graphSchema": "{spaceSchema}",
    "format": {
      "nodes": [{
        "name": "",
        "type": "",
        "props": {}
      }],
      "edges": [{
        "src": "",
        "dst": "",
        "type": "",
        "props": "{props}"
      }]
    }
  }
}
reuslt:`;

export interface LLMConfig {
  url: string;
  apiType: string;
  llmVersion: string;
  key: string;
  features: string[];
  maxContextLength: number;
  enableCopilot: boolean;
  enableLLM2NGQLs: boolean;
  gqlPath: string;
}
class LLM {
  currentInput = '';
  open = false;
  config = {
    maxContextLength: 2000,
    url: 'https://{your-resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version={api-version}',
    apiType: 'openai',
    features: ['spaceSchema', 'useConsoleNGQL'],
  } as LLMConfig;
  widget: HTMLSpanElement;
  editor: any;
  mode = 'text2ngql' as 'text2ngql' | 'text2cypher';
  completionList: { text: string; type: string }[] = [];
  constructor() {
    makeAutoObservable(this, {
      editor: false,
      widget: false,
    });
    this.fetchConfig();
  }

  fetchConfig() {
    return get('/api/config/llm')().then((res) => {
      if (res.code != 0 || !res.data) return;
      const { config, ...values } = res.data.config;
      const configMap = config ? safeParse<LLMConfig>(config) : {};
      this.setConfig({
        ...configMap,
        ...values,
        gqlPath: res.data.gqlPath,
      });
      return this.config;
    });
  }

  setConfig(payload: LLMConfig) {
    this.config = { ...this.config, ...payload };
  }

  update(payload: any) {
    Object.assign(this, payload);
  }

  async getSpaceSchema(space: string) {
    let finalPrompt: any = {
      spaceName: space,
    };
    if (this.config.features.includes('spaceSchema')) {
      await schema.switchSpace(space);
      await schema.getTagList();
      await schema.getEdgeList();
      const tagList = schema.tagList;
      const edgeList = schema.edgeList;
      finalPrompt = {
        ...finalPrompt,
        vidType: schema.spaceVidType,
        nodeTypes: tagList.map((item) => {
          return {
            type: item.name,
            props: item.fields.map((item) => {
              return {
                name: item.Field,
                dataType: item.Type,
                nullable: (item as any).Null === 'YES',
              };
            }),
          };
        }),
        edgeTypes: edgeList.map((item) => {
          return {
            type: item.name,
            props: item.fields.map((item) => {
              return {
                name: item.Field,
                dataType: item.Type,
                nullable: (item as any).Null === 'YES',
              };
            }),
          };
        }),
      };
    }
    return JSON.stringify(finalPrompt);
  }

  async getDocPrompt(text: string) {
    let prompt = matchPrompt; // default use text2cypher
    if (this.mode !== 'text2cypher') {
      text = text.replaceAll('"', "'");
      const res = (await ws.runChat({
        req: {
          temperature: 0.5,
          stream: false,
          max_tokens: 20,
          messages: [
            {
              role: 'user',
              content: `From the following graph database book categories: "${ngqlDoc.NGQLCategoryString}" find top two useful categories to solve the question:"${text}",don't explain,just return the two combined categories, separated by ',' is:`,
            },
          ],
        },
      })) as any;
      if (res.code === 0) {
        const url = res.message.choices[0].message?.content as string;
        const paths = url
          .toLowerCase()
          .replaceAll(/\s|"|\\/g, '')
          .split(',');
        console.log('select doc url:', paths);
        if (ngqlDoc.ngqlMap[paths[0]]) {
          let doc = ngqlDoc.ngqlMap[paths[0]].content;
          if (!doc) {
            doc = '';
          }
          const doc2 = ngqlDoc.ngqlMap[paths[1]].content;
          if (doc2) {
            doc += doc2;
          }
          doc = doc.replaceAll(/\n\n+/g, '');
          if (doc.length) {
            console.log('docString:', doc);
            prompt = `learn the below doc, and use it to help user ,the user space schema is "{schema}" the doc is: \n${doc.slice(
              0,
              this.config.maxContextLength,
            )} the question is "{query_str}"`;
          }
        }
      }
    }
    prompt = prompt.replace('{query_str}', text);
    const pathname = window.location.pathname;
    const space = pathname.indexOf('schema') > -1 ? rootStore.schema.currentSpace : rootStore.console.currentSpace;
    if (!space) {
      return prompt.replace('{schema}', 'no space selected');
    }
    let schemaPrompt = await this.getSpaceSchema(space);

    if (this.config.features.includes('useConsoleNGQL')) {
      schemaPrompt += `\nuser console ngql context: ${rootStore.console.currentGQL}`;
    }
    prompt = prompt.replace('{schema}', schemaPrompt);
    return prompt;
  }

  timer;
  running = false;
  async checkCopilotList(cm: any) {
    clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      let snippet = '';
      const cursor = cm.getCursor();
      const line = cm.getLine(cursor.line).split(';').pop();
      if (cursor.ch < line.length - 1) return;
      if (line.length < 3) return;
      const tokens = line.split(' ');
      const firstToken = tokens.find((item) => item.replaceAll(' ', '').length > 0);
      const hits = ngqlDoc.ngqlDoc.filter((each) => each.title.toLowerCase().indexOf(firstToken.toLowerCase()) === 0);
      let doc = '';
      if (this.mode == 'text2cypher' && firstToken.toLowerCase() == 'match') {
        doc += matchPrompt;
      } else {
        if (hits.length) {
          hits.find((item) => {
            if (doc.length > this.config.maxContextLength) return true;
            doc += item + '\n';
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
          temperature: 1.0,
          stream: false,
          presence_penalty: 0.6,
          max_tokens: 30,
          messages: [
            {
              role: 'user',
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
        if (snippet.indexOf('Sorry') > -1) {
          snippet = '';
        }
      }
      if (snippet) {
        this.update({
          completionList: snippet
            .split('\n')
            .map((each) => ({
              type: 'copilot',
              text: each,
            }))
            .filter((item) => item.text !== ''),
        });
      }
      this.running = false;
    }, 3000);
  }
}

export default new LLM();
