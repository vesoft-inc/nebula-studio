import {
  Popover,
  Switch,
} from "antd";
import styles from "./index.module.less";
import Chat from "./chat";
import Icon from "@app/components/Icon";
import { observer } from "mobx-react-lite";
import rootStore from "@app/stores";
// float gpt bot window
function GPTBot() {
  const gpt = rootStore.gpt;
  const { open } = gpt;
  if (!gpt.config.enableGPT2NGQLs) {
    return null;
  }
  return (
    <>
      <Popover
        zIndex={999}
        open={open}
        placement="topLeft"
        onOpenChange={(visible) => {
          gpt.update({
            open: visible,
          })
        }}
        content={<Chat />}
        title={
          <div className={styles.gptBotTitle}>
            <div className={styles.gptBotTitleInner}>
              GPT2nGQL{" "}
            </div>
            <div className={styles.gptBotHandler}>
              text2cypher
              <Switch
                style={{ margin: "0 5px" }}
                onChange={(checked) => {
                  gpt.update({
                    mode: checked ? "text2cypher" : "text2ngql",
                  });
                }}
                checked={gpt.mode == "text2cypher"}
              />
            </div>
          </div>
        }
        trigger={"click"}
      >
        <div className={styles.gptBot}>
          <div className={styles.ball}>
            {!open ? <Icon className={styles.open} type="icon-studio-btn-consoleGTP" /> : <Icon type="icon-studio-btn-close" />}
          </div>
        </div>
      </Popover>
      <svg style={{ width: 0, height: 0 }}>
        <defs>
          <linearGradient id="gpt-icon" x1="50%" y1="0%" x2="50%" y2="100%" >
            <stop offset="0%" stopColor="#127BB8"></stop>
            <stop offset="100%" stopColor="#12AEB8"></stop>
          </linearGradient>
        </defs>
      </svg>
    </>
  );
}


export default observer(GPTBot);
