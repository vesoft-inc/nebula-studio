import { Button, Input } from 'antd';
import styles from './chat.module.less';
import { useEffect, useRef, useState } from 'react';
import ws from '@app/utils/websocket';
import { debounce } from 'lodash';
import rootStore from '@app/stores';
import CodeMirror from '@app/components/CodeMirror';
import { observer } from 'mobx-react-lite';
import { useI18n } from '@vesoft-inc/i18n';
import { LoadingOutlined } from '@ant-design/icons';

function Chat() {
  const { intl } = useI18n();
  const llm = rootStore.llm;
  const [pending, setPending] = useState(false);
  const contentRef = useRef<HTMLDivElement>();
  const [messages, setMessages] = useState([]); // [{role: 'user', content: 'hello'}, {role: 'system', content: 'hello'}
  const onSend = debounce(async () => {
    const { currentInput } = llm;
    if (currentInput === '') return;
    setPending(true);
    // just use last 5 message
    const beforeMessages =
      rootStore.llm.mode === 'text2cypher' ? [] : [...messages.slice(messages.length - 5, messages.length)];
    const newMessages = [
      ...messages,
      { role: 'user', content: currentInput },
      { role: 'assistant', content: '', status: 'pending' },
    ];
    llm.update({
      currentInput: '',
    });
    setMessages(newMessages);
    const systemPrompt = await rootStore.llm.getDocPrompt(currentInput);
    const sendMessages = [
      {
        role: 'system',
        content: 'You are a helpful NebulaGraph database assistant to help user.',
      },
      // slice 100 char
      ...beforeMessages.map((item) => ({
        role: item.role,
        content: item.content.trim().slice(-100),
      })),
      {
        role: 'user',
        content:
          (/[\u4e00-\u9fa5]/.test(currentInput) ? '请使用中文' : 'Please use English') +
          'you need use markdown to reply short and clearly. add ``` as markdown code block to write the ngql.one ngql need be one line ' +
          systemPrompt,
      },
    ];
    console.log(sendMessages);
    ws.runChat({
      req: {
        stream: true,
        temperature: 0.2,
        messages: sendMessages,
      },
      callback: (res) => {
        if (res.message.done) {
          newMessages[newMessages.length - 1].status = 'done';
          setPending(false);
          return;
        }
        try {
          let text = '';
          // special for qwen api, qwen api will return a hole message
          if (llm.config.apiType === 'qwen') {
            text = res.message.output.choices[0].message.content || '';
            newMessages[newMessages.length - 1].content = text;
            if (res.message.output.choices[0].finish_reason === 'stop') {
              newMessages[newMessages.length - 1].status = 'done';
              setPending(false);
              return;
            }
          } else {
            if (res.message.choices[0].message === 'stop') {
              newMessages[newMessages.length - 1].status = 'done';
              setPending(false);
              return;
            }
            text = res.message.choices[0].delta?.content || '';
            newMessages[newMessages.length - 1].content += text;
          }
          setMessages([...newMessages]);
        } catch (e) {
          setPending(false);
        }
      },
    });
  }, 200);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  function renderContent(message: { role: string; content: string; status?: string }) {
    if (!message.content && message.status === 'pending') {
      return (
        <div className={styles.loading}>
          <LoadingOutlined />
          loading...
        </div>
      );
    }
    const gqls = message.content.split(/```([^`]+)```/);
    return gqls.map((item, index) => {
      if (index % 2 === 0) {
        return <p key={index}>{item}</p>;
      } else {
        item = item.replace(/^(\n|ngql|gql|cypher)/g, '').replace(/\n$/g, '');
        if (message.status !== 'done') {
          return <code key={index}>{item}</code>;
        }
        return (
          <div key={index} className={styles.codeWrapper}>
            <CodeMirror
              height="120"
              value={item}
              options={{
                mode: 'nebula',
              }}
            />
            <Button
              className={styles.copyBtn}
              onClick={() => {
                rootStore.console.update({
                  currentGQL: item,
                });
              }}
            >
              {intl.get('console.copy2NGQL')}
            </Button>
          </div>
        );
      }
    });
  }

  return (
    <div
      className={styles.chat}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className={styles.chatContent} ref={contentRef}>
        <div className={styles.chatContentInner}>
          {messages.map((item, index) => {
            return (
              <div
                key={index}
                className={styles.chatMessage + ' ' + styles[item.role == 'user' ? 'fromUser' : 'fromBot']}
              >
                <div className={styles.chatMessageInner}>
                  <div className={styles.chatMessageContent}>{renderContent(item)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.chatInput}>
        <Input.TextArea
          value={llm.currentInput}
          onChange={(e) => {
            llm.update({
              currentInput: e.target.value,
            });
          }}
        />
        <Button type="primary" size="small" loading={pending} onClick={onSend}>
          {intl.get('console.send')}
        </Button>
      </div>
    </div>
  );
}

export default observer(Chat);
