import { makeAutoObservable } from 'mobx';
import { get } from '@app/utils/http';
import ws from '@app/utils/websocket';
import { safeParse } from '@app/utils/function';
import * as ngqlDoc from '@app/utils/ngql';
import schema from './schema';
import rootStore from '.';

export const matchPrompt = `I want you to be a NebulaGraph database assistant.
There are below document.
----
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
---
answer the user's question with the question language
`;

export const docFinderPrompt = `The task is to identify the top2 effectively categories from 
\`\`\`categories
{category_string}
\`\`\`
that answer the question "{query_str}" with the user's history ask is:"{history_str}" for graph database write gql.
just return the output that should be a comma-separated list like "category1,category2" and don't explain anything`;

export const text2queryPrompt = `Assuming you are an  NebulaGraph database AI assistant, your role is to assist users in crafting NGQL queries with NebulaGraph. You have access to the following details:
the user space schema is:
----
{schema}
 ----
the reference documentation provided is: \n
----
{doc}
----
Please marked(\`\`\`ngql) for markdown code block to write the ngql and answer the user's question with the question language`;

export const AgentTask = `Assume you are a NebulaGraph AI chat assistant. You need to help the user to write NGQL or solve other question. 
You have access to the following information:
1. The user's console NGQL context is: {current_ngql}
2. The user's current graph space is: {space_name}
3. Your last memory is: {memory}
4. The user's question is: {query_str}

You can use command to get extra information which will be added to your memory for answering the next question. then you can use the memory to solve the question.
You can just use the following command:
\\get-doc-categories: Retrieve the list of the NebulaGraph document categories.
\\get-doc category_name: Obtain the document via category name.
\\run-ngql ngql_command: Execute NGQL.
\\get-schema: Retrieve the schema of the user's current graph space.
\\finish result: Complete the task and return the result in the language of the user's question to reply to the user.if you reply ngql,you need wrap it with \`\`\`ngql

Command:
`;

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
  model: string;
}
class LLM {
  currentInput = '';
  open = false;
  config = {
    maxContextLength: 2000,
    url: 'https://api.openai.com/v1/chat/completions',
    apiType: 'openai',
    model: 'gpt-3.5-turbo',
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
  }

  fetchConfig() {
    return get('/api/config/llm')().then((res) => {
      if (res.code !== 0 || !res.data) return;
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
    const finalPrompt = `The user's current graph space is: ${space} \n`;
    if (this.config.features.includes('spaceSchema')) {
      await schema.switchSpace(space);
      await schema.getTagList();
      await schema.getEdgeList();
      const tagList = schema.tagList;
      const edgeList = schema.edgeList;
      let nodeSchemaString = '';
      const edgeSchemaString = '';
      tagList.forEach((item) => {
        nodeSchemaString += `NodeType ${item.name} (${item.fields
          .map((field) => `${field.Field}:${field.Type}`)
          .join(' ')})\n`;
      });
      edgeList.forEach((item) => {
        nodeSchemaString += `EdgeType ${item.name} (${item.fields
          .map((field) => `${field.Field}:${field.Type}`)
          .join(' ')})\n`;
      });
      return finalPrompt + nodeSchemaString + edgeSchemaString;
    }
    return finalPrompt;
  }

  async getAgentPrompt(query_str: string, historyMessages: any, callback: (res: any) => void) {
    //      {current_ngql}
    // 2. The user's current graph space is: {space_name}
    // 3. Your last memory is: {memory}
    // 4. The user's question is: {query_str}
    let memory = '';
    const finish = async (text: string) => {
      if (text.indexOf('\\finish') > -1) {
        return;
      }
      memory = '';
      const command = text.match(/\\([\w|-]+)(\s+([\s\S]*))?/);
      if (command) {
        const [, cmd, , args] = command;
        switch (cmd) {
          case 'get-doc-categories':
            memory += `(get-doc-categories: ${ngqlDoc.NGQLCategoryString})\n`;
            break;
          case 'get-doc':
            memory += `(get-doc : ${ngqlDoc.ngqlMap[args.toLowerCase()]?.content || 'no doc'})\n`;
            break;
          case 'run-ngql':
            // eslint-disable-next-line no-case-declarations
            const res = (await ws.runNgql({ gql: args, space: rootStore.console.currentSpace })) as any;
            memory += `(run-ngql :${JSON.stringify(res?.data?.tables)})\n`;
            break;
          case 'get-schema':
            // eslint-disable-next-line no-case-declarations
            const schema = await this.getSpaceSchema(rootStore.console.currentSpace);
            memory += `(get-schema: ${schema})\n`;
            break;
          default:
            return;
        }
        run();
      }
    };
    const run = async () => {
      let prompt = AgentTask;
      let message = '';
      prompt = prompt.replace('{current_ngql}', rootStore.console.currentGQL);
      prompt = prompt.replace('{space_name}', rootStore.console.currentSpace);
      prompt = prompt.replace('{memory}', memory || 'empty');
      prompt = prompt.replace('{query_str}', query_str);
      console.log(prompt);
      await ws.runChat({
        req: {
          stream: true,
          max_tokens: 20,
          messages: [
            ...historyMessages,
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        callback: (res) => {
          if ((message.length && message.indexOf('\\') !== 0) || message.indexOf('\\finish') > -1) {
            return callback(res);
          }
          if (res.message.done) {
            finish(message);
            return;
          }
          let text = '';
          // special for qwen api, qwen api will return a hole message
          if (this.config.apiType === 'qwen') {
            text = res.message.output.choices[0].message.content || '';
            if (res.message.output.choices[0].finish_reason === 'stop') {
              finish(message);
              return;
            }
            message = text;
          } else {
            if (res.message.choices?.[0].message === 'stop') {
              finish(message);
              return;
            }
            text = res.message.choices[0].delta?.content || '';
            message += text;
          }
        },
      });
    };
    run();
  }

  async getDocPrompt(text: string, historyMessages: any) {
    let prompt = matchPrompt;
    if (this.mode !== 'text2cypher') {
      text = text.replaceAll('"', "'");
      const history = historyMessages
        .filter((item) => item.role === 'user')
        .map((item) => item.content)
        .join(',');
      const docPrompt = docFinderPrompt
        .replace('{category_string}', ngqlDoc.NGQLCategoryString)
        .replace('{query_str}', text)
        .replace('{history_str}', history)
        .replace('{space_name}', rootStore.console.currentSpace);
      console.log(docPrompt);
      const res = (await ws.runChat({
        req: {
          stream: false,
          max_tokens: 40,
          top_p: 0.8,
          messages: [
            {
              role: 'user',
              content: docPrompt,
            },
          ],
        },
      })) as any;
      if (res.code === 0) {
        let url = '';
        try {
          url = (res.message.choices[0].message?.content as string)?.split('\n')[0];
        } catch {
          throw new Error(JSON.stringify(res.message));
        }
        const paths = url
          .toLowerCase()
          .replaceAll('，', ',') // chinese comma
          .split(',')
          .map((path) => path.replaceAll(/\s|"|\\/g, ''));
        console.log('select doc url:', paths);
        if (paths[0] !== 'sorry') {
          prompt = text2queryPrompt;
          let doc = ngqlDoc.ngqlMap[paths[0]]?.content;
          if (!doc) {
            doc = '';
          }
          const doc2 = ngqlDoc.ngqlMap[paths[1]]?.content;
          if (doc2) {
            doc = (doc + `\n` + doc2).slice(0, this.config.maxContextLength);
          }
          doc = doc.replaceAll(/\n\n\n+/g, '');
          if (doc.length) {
            prompt = text2queryPrompt.replace('{doc}', doc);
          }
        }
      }
    }

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
    console.log(prompt);
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
      if (this.mode === 'text2cypher' && firstToken.toLowerCase() === 'match') {
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
          presence_penalty: 1.1,
          max_tokens: 30,
          top_p: 0.8,
          top_k: 40,
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
