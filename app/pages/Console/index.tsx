import { Button, Select, Tooltip, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { trackEvent, trackPageView } from '@app/utils/stat';
import { useStore } from '@app/stores';
import Icon from '@app/components/Icon';
import CodeMirror from '@app/components/CodeMirror';
import cls from 'classnames';
import { useI18n } from '@vesoft-inc/i18n';
import OutputBox from './OutputBox';
import HistoryBtn from './HistoryBtn';
import FavoriteBtn from './FavoriteBtn';
import CypherParameterBox from './CypherParameterBox';
import ExportModal from './ExportModal';
import SchemaDrawer from './SchemaDrawer';
import styles from './index.module.less';
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
  const { schema, console } = useStore();
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
  } = console;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    space: string;
    spaceVidType: string;
    [key: string]: any;
  }>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  return (
    <div className={styles.nebulaConsole}>
      <SchemaDrawer open={drawerOpen} setOpen={setDrawerOpen} />
      <div className={cls('studioCenterLayout', styles.consoleContainer)}>
        <div className={styles.consolePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.title}>{`${window.gConfig.databaseName} ${intl.get('common.console')}`}</span>
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
              onChange={(value) => update({ currentGQL: value })}
              ref={editor}
              height="120px"
              onShiftEnter={handleRun}
              options={{
                keyMap: 'sublime',
                fullScreen: true,
                mode: 'nebula',
              }}
            />
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
              result={{ id: 'empty', gql: '', code: 0, data: { headers: [], tables: [] } }}
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
