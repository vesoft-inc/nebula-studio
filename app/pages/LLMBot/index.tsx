import { Popover, Switch } from 'antd';
import styles from './index.module.less';
import Chat from './chat';
import Icon from '@app/components/Icon';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
// float llm bot window
function LLMBot() {
  const { global, llm } = useStore();
  if (global.appSetting?.beta?.functions?.text2query.open != true) {
    return null;
  }
  const { open } = llm;

  return (
    <>
      <Popover
        zIndex={999}
        open={open}
        placement="topLeft"
        onOpenChange={(visible) => {
          llm.update({
            open: visible,
          });
        }}
        content={<Chat />}
        title={
          <div className={styles.llmBotTitle}>
            <div className={styles.llmBotTitleInner}>AI Asistant</div>
            <div className={styles.llmBotHandler}>
              text2match
              <Switch
                style={{ margin: '0 5px' }}
                onChange={(checked) => {
                  llm.update({
                    mode: checked ? 'text2cypher' : 'text2ngql',
                  });
                }}
                checked={llm.mode == 'text2cypher'}
              />
            </div>
          </div>
        }
        trigger={'click'}
      >
        <div className={styles.llmBot}>
          <div className={styles.ball}>
            {!open ? (
              <Icon className={styles.open} type="icon-studio-btn-consoleGTP" />
            ) : (
              <Icon type="icon-studio-btn-close" />
            )}
          </div>
        </div>
      </Popover>
      <svg style={{ width: 0, height: 0 }}>
        <defs>
          <linearGradient id="llm-icon" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#127BB8"></stop>
            <stop offset="100%" stopColor="#12AEB8"></stop>
          </linearGradient>
        </defs>
      </svg>
    </>
  );
}

export default observer(LLMBot);
