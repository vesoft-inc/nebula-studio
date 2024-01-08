import { Button, Input, message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import ws from '@app/utils/websocket';
import { debounce } from 'lodash';
import rootStore from '@app/stores';
import { observer } from 'mobx-react-lite';
import { useI18n } from '@vesoft-inc/i18n';
import { LoadingOutlined } from '@ant-design/icons';
import MonacoEditor from '@app/components/MonacoEditor';
import styles from './chat.module.less';

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
    const beforeMessages = messages;
    const newMessages = [
      ...beforeMessages,
      { role: 'user', content: currentInput },
      { role: 'assistant', content: '', status: 'pending' }, // asistant can't be changed
    ];
    llm.update({
      currentInput: '',
    });
    setMessages(newMessages);
    const callback = (res) => {
      if (res.code !== 0) {
        resetPending(newMessages,res.message);
        return;
      }
      if (res.message.done) {
        resetPending(newMessages);
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
        resetPending(newMessages,e.message+"\n response: \n"+JSON.stringify(res.message,null,2));
      }
    };
    const sendMessages = [
      // slice 50 char for last 5 message
      ...beforeMessages.slice(-5).map((item) => ({
        role: item.role,
        content: item.content.length > 50 ? item.content.trim().slice(0, 50) + '...' : item.content.trim(),
      })),
    ];
    const systemPrompt = await rootStore.llm.getDocPrompt(currentInput, sendMessages);
    await ws.runChat({
      req: {
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...sendMessages, { role: 'user', content: currentInput }],
      },
      callback,
    }).catch((e) => {
      message.error(e.message);
      resetPending(newMessages,e.message);
    });
  }, 200);
  const resetPending =  useCallback((messages,msg?:string) => {
    setPending(false);
    setMessages(messages.map((item) => {
      if(item.status !== 'pending') return item;
      item.status = 'done';
      item.content = msg ?(`[error] ${msg}`): item.content;
      return item;
    }))
  },[])

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
    const gqls = message.content.split(/```\w*\n([^`]+)```/);
    return gqls.map((item, index) => {
      if (index % 2 === 0) {
        return <p key={index}>
          <pre>{item}</pre>
        </p>;
      } else {
        item = item.replace(/^(\n|ngql|gql|cypher)/g, '').replace(/\n$/g, '');
        item = item.replace(/\n\n/, '\n');
        if (message.status !== 'done') {
          return <code key={index}>{item}</code>;
        }
        return (
          <div key={index} className={styles.codeWrapper}>
            <MonacoEditor readOnly height="120px" value={item} />
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
                className={styles.chatMessage + ' ' + styles[item.role === 'user' ? 'fromUser' : 'fromBot']}
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
