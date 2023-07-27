import { Button, Popover, Select, Tooltip, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { trackEvent, trackPageView } from '@app/utils/stat';
import { useStore } from '@app/stores';
import Icon from '@app/components/Icon';
import CodeMirror from '@app/components/CodeMirror';
import { useI18n } from '@vesoft-inc/i18n';
import OutputBox from './OutputBox';
import HistoryBtn from './HistoryBtn';
import FavoriteBtn from './FavoriteBtn';
import CypherParameterBox from './CypherParameterBox';
import ExportModal from './ExportModal';
import styles from './index.module.less';
import { LoadingOutlined } from '@ant-design/icons';
import Setting from './Setting';
const Option = Select.Option;

// split from semicolon out of quotation marks
const SEMICOLON_REG = /((?:[^;'"]*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')[^;'"]*)+)|;/;

const getHistory = () => {
  const value: string | null = localStorage.getItem('history');
  if (value && value !== 'undefined' && value !== 'null') {
    return JSON.parse(value).slice(0, 15);
  }
  return [];
};

interface IProps {
  onExplorer?: (params: { space: string; vertexes: any[]; edges: any[] }) => void;
  templateRender?: (data?) => JSX.Element;
}
const Console = (props: IProps) => {
  const { schema, console, gpt } = useStore();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const { intl } = useI18n();
  const { onExplorer, templateRender } = props;
  const { spaces, getSpaces } = schema;
  const {
    runGQL,
    currentGQL,
    results,
    runGQLLoading,
    getParams,
    update,
    paramsMap,
    getFavoriteList,
    currentSpace,
    updateCurrentSpace,
    completionList,
    activeCompletionIndex,
  } = console;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    space: string;
    spaceVidType: string;
    [key: string]: any;
  }>(null);
  const editor = useRef<any>(null);
  useEffect(() => {
    trackPageView('/console');
    getSpaces();
    getParams();
    getFavoriteList();
  }, []);

  const checkSwitchSpaceGql = (query: string) => {
    const queryList = query.split(SEMICOLON_REG).filter(Boolean);
    const reg = /^USE `?.+`?(?=[\s*;?]?)/gim;
    if (queryList.some((sentence) => sentence.trim().match(reg))) {
      return intl.get('common.disablesUseToSwitchSpace');
    }
  };

  const updateGql = (value: string, space?: string) => {
    update({ currentGQL: value, currentSpace: space || currentSpace });
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleSaveQuery = (query: string) => {
    if (query !== '') {
      const history = getHistory();
      history.unshift(query);
      localStorage.setItem('history', JSON.stringify(history));
    }
  };

  const handleRun = async () => {
    if (editor.current) {
      const value = editor.current!.editor.getValue();
      const query = value
        .split('\n')
        .filter((i) => !i.trim().startsWith('//') && !i.trim().startsWith('#'))
        .join('\n');
      if (!query) {
        message.error(intl.get('common.sorryNGQLCannotBeEmpty'));
        return;
      }
      const errInfo = checkSwitchSpaceGql(query);
      if (errInfo) {
        return message.error(errInfo);
      }
      editor.current!.editor.execCommand('goDocEnd');
      handleSaveQuery(query);
      await runGQL({ gql: query, editorValue: value });
    }
  };

  const addParam = (param: string) => {
    update({ currentGQL: currentGQL + ` $${param}` });
  };

  const handleResultConfig = (data: { space: string; spaceVidType: string; [key: string]: any }) => {
    setModalData(data);
    setModalVisible(true);
  };

  const handleExplorer = async (data) => {
    if (!onExplorer) {
      return;
    }
    await onExplorer!(data);
    !modalVisible && setModalVisible(false);
    trackEvent('navigation', 'view_explore', 'from_console_btn');
  };
  const handleGetSpaces = (open: boolean) => {
    open && getSpaces();
  };
  const changePos = () => {
    const cm = editor.current.editor;
    const coords = cm.cursorCoords(cm.getCursor(), 'local');
    setPos({
      x: coords.left + cm.display.lineGutter.clientWidth - 12,
      y: coords.top + 10,
    });
  };
  return (
    <div className={styles.nebulaConsole}>
      <Setting open={visible} setVisible={setVisible} />
      <div className="studioCenterLayout">
        <div className={styles.consolePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.title}>{`${window.gConfig.databaseName} ${intl.get('common.console')}`}</span>
            <Icon className={styles.setting} type={'icon-studio-btn-consoleSetting'} onClick={() => setVisible(true)} />
            <div className={styles.operations}>
              <div className={styles.spaceSelect}>
                <Select
                  allowClear
                  value={currentSpace || null}
                  placeholder={intl.get('console.selectSpace')}
                  onDropdownVisibleChange={handleGetSpaces}
                  onChange={updateCurrentSpace}
                >
                  {spaces.map((space) => (
                    <Option value={space} key={space}>
                      {space}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className={styles.btnOperations}>
                {gpt.config.enableGPT2NGQLs && (
                  <Tooltip title={intl.get('console.gptIconTip')}>
                    <Icon
                      onClick={() => {
                        gpt.update({
                          currentInput: intl.get('console.explain') + ':' + currentGQL,
                          open: true,
                        });
                      }}
                      className={styles.btnOperations}
                      type="icon-studio-btn-consoleGTP"
                    />
                  </Tooltip>
                )}
                {gpt.config.enableCopilot && (
                  <Tooltip title={intl.get('console.copilotTip')}>
                    {!gpt.running ? (
                      <Icon
                        onClick={() => {
                          gpt.checkCopilotList(editor.current.editor);
                        }}
                        className={styles.btnOperations}
                        type={'icon-studio-btn-consoleTip'}
                      />
                    ) : (
                      <LoadingOutlined className={styles.btnOperations} />
                    )}
                  </Tooltip>
                )}
                {templateRender?.(currentGQL)}
                <FavoriteBtn onGqlSelect={updateGql} />
                <HistoryBtn onGqlSelect={updateGql} />
                <Tooltip title={intl.get('common.empty')} placement="top">
                  <Icon
                    className={styles.btnOperations}
                    type="icon-studio-btn-clear"
                    onClick={() => update({ currentGQL: '' })}
                  />
                </Tooltip>
                <Button type="primary" onClick={handleRun} loading={runGQLLoading}>
                  <Icon type="icon-studio-btn-play" />
                  {intl.get('common.run')}
                </Button>
              </div>
            </div>
          </div>
          <div className={styles.codeInput}>
            <CypherParameterBox onSelect={addParam} data={paramsMap} />
            <CodeMirror
              value={currentGQL}
              onKeyDown={(change) => {
                if (change.key === 'Tab' && console.showCompletion) {
                  console.insertCompletion(editor.current.editor);
                  change.preventDefault();
                }
              }}
              onChange={(value) => {
                update({ currentGQL: value });
                console.calcCompletions(editor.current.editor);
                gpt.checkCopilotList(editor.current.editor);
                changePos();
              }}
              ref={editor}
              height="120px"
              onShiftEnter={handleRun}
              options={{
                keyMap: 'sublime',
                fullScreen: true,
                mode: 'nebula',
              }}
            />
            <Popover
              trigger={'click'}
              onOpenChange={(open) => {
                console.update({ showCompletion: open });
              }}
              placement="bottomLeft"
              open={console.showCompletion}
              key={`${pos.x}-${pos.y}`}
              rootClassName={styles.completions}
              content={
                <div className={styles.completionsContent}>
                  {[...completionList, ...gpt.completionList].map((item, index) => (
                    <div
                      onClick={() => {
                        console.insertCompletion(editor.current.editor, index);
                      }}
                      className={styles.completionsItem + ' ' + (index === activeCompletionIndex ? styles.active : '')}
                      key={index}
                    >
                      <div className={styles.completionsItemName}>
                        {item.type === 'copilot' ? (
                          <CodeMirror
                            value={item.text}
                            options={{
                              mode: 'nebula',
                              lineWrapping: false,
                              readOnly: true,
                              lineNumbers: false,
                              scrollbarStyle: 'null',
                            }}
                            height="30"
                          />
                        ) : (
                          <div className={styles.keywordTitle}>{item.text}</div>
                        )}
                      </div>
                      <div className={styles.completionsItemDesc}>{item.type}</div>
                    </div>
                  ))}
                  {gpt.running && (
                    <div className={`${styles.completionsItem} ${styles.gptRunning}`}>
                      <LoadingOutlined className={styles.btnOperations} />
                      GPT loading...
                    </div>
                  )}
                </div>
              }
            >
              <span
                style={{
                  position: 'absolute',
                  top: pos.y,
                  left: pos.x,
                }}
              ></span>
            </Popover>
          </div>
        </div>
        <div className="result-wrap">
          {results.length > 0 ? (
            results.map((item, index) => (
              <OutputBox
                key={item.id}
                index={index}
                result={item}
                templateRender={templateRender}
                onExplorer={onExplorer ? handleExplorer : undefined}
                onHistoryItem={(gql, space) => updateGql(gql, space)}
                onResultConfig={handleResultConfig}
              />
            ))
          ) : (
            <OutputBox
              key="empty"
              index={0}
              result={{
                id: 'empty',
                gql: '',
                code: 0,
                data: { headers: [], tables: [] },
              }}
              onHistoryItem={(gql) => updateGql(gql)}
            />
          )}
        </div>
      </div>
      {modalVisible && (
        <ExportModal
          visible={modalVisible}
          data={modalData}
          onClose={() => setModalVisible(false)}
          onExplorer={handleExplorer}
        />
      )}
    </div>
  );
};
export default observer(Console);
