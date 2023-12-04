import { Button, Select, Spin, Tooltip, message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { trackEvent, trackPageView } from '@app/utils/stat';
import type { editor as TMonacoEditor } from 'monaco-editor';
import { type Monaco } from '@monaco-editor/react';
import { useStore } from '@app/stores';
import Icon from '@app/components/Icon';
import MonacoEditor from '@app/components/MonacoEditor';
import { useI18n } from '@vesoft-inc/i18n';
import { safeParse } from '@app/utils/function';
import OutputBox from './OutputBox';
import HistoryBtn from './HistoryBtn';
import FavoriteBtn from './FavoriteBtn';
import CypherParameterBox from './CypherParameterBox';
import ExportModal from './ExportModal';
import SchemaDrawer from './Drawer/SchemaDrawer';
// import NgqlDrawer from './Drawer/NgqlDrawer';
import styles from './index.module.less';
import { SchemaItemOverview } from '@app/stores/console';
import LLMBot from '../LLMBot';

const Option = Select.Option;

// split from semicolon out of quotation marks
const SEMICOLON_REG = /((?:[^;'"]*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')[^;'"]*)+)|;/;

const getHistory = () => {
  const value: string | null = localStorage.getItem('history');
  if (value && value !== 'undefined' && value !== 'null') {
    return safeParse<string[]>(value)?.slice(0, 15) || [];
  }
  return [];
};

interface IProps {
  onExplorer?: (params: { space: string; vertexes: any[]; edges: any[] }) => void;
  templateRender?: (data?) => JSX.Element;
}
const Console = (props: IProps) => {
  const { schema, console: consoleStore } = useStore();
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
  } = consoleStore;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    space: string;
    spaceVidType: string;
    [key: string]: any;
  }>(null);
  const [schemaTree, setSchemaTree] = useState<SchemaItemOverview>({} as SchemaItemOverview);
  const [editorLoading, setEditorLoading] = useState(false);
  const editor = useRef<{ monaco: Monaco; editor: TMonacoEditor.IStandaloneCodeEditor }>();
  const resultContainerRef = useRef<HTMLDivElement>();
  const historyProviderRef = useRef(null);
  useEffect(() => {
    trackPageView('/console');
    getSpaces();
    getParams();
    getFavoriteList();
    currentSpace && handleSwitchSpace(currentSpace);
    return () => {
      historyProviderRef.current?.dispose();
    };
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
  };

  const handleSaveQuery = (query: string) => {
    if (query !== '') {
      const history = getHistory();
      history.unshift(query);
      localStorage.setItem('history', JSON.stringify(history));
      setHistoryProvider();
    }
  };

  const handleRun = async (text?: string) => {
    if (!editor.current) return;
    const _editor = editor.current.editor;
    const editorValue = _editor.getValue();
    const value = text || editorValue;
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

    handleSaveQuery(query);
    await runGQL({ gql: query, editorValue });
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
  const setHistoryProvider = () => {
    historyProviderRef.current?.dispose();
    const { monaco, editor: _editor } = editor.current;
    const history = getHistory();
    if (!history?.length) {
      return;
    }
    historyProviderRef.current = monaco?.languages.registerCompletionItemProvider('ngql', {
      provideCompletionItems: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        if (lineContent !== '/') {
          return;
        }
        const suggestions = [
          ...Array.from(new Set(history)).map((k: string, index) => {
            const sortText = String(index + 1);
            return {
              label: k,
              kind: monaco.languages.CompletionItemKind.Text,
              insertText: k,
              detail: intl.get('common.historyRecord'),
              sortText,
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column,
              },
            };
          }),
        ];
        return {
          suggestions: suggestions,
          dispose: () => {
            const line = position.lineNumber;
            const column = position.column;
            const range = new monaco.Range(line, column - 1, line, column);
            if (model.getValueInRange(range) !== '/') {
              return;
            }
            const text = model.getValue().replace('/', '');
            _editor.setValue(text);
            _editor.setPosition({ lineNumber: line, column: text.length + 1 });
          },
        };
      },
      triggerCharacters: ['/'],
    });
  };

  const onInstanceMount = (instance, monaco) => {
    editor.current = {
      editor: instance,
      monaco: monaco,
    };
    instance.addAction({
      id: 'my-unique-id',
      label: intl.get('console.runSelectionRows'),
      // keybindings: [
      //   monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_E,
      // ],
      contextMenuGroupId: 'myMenu',
      contextMenuOrder: 1.5,
      run: function () {
        const _editor = editor.current.editor;
        let value = '';
        const selection = _editor.getSelection();
        if (selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn) {
          for (let lineNumber = selection.startLineNumber; lineNumber <= selection.endLineNumber; lineNumber++) {
            value += _editor.getModel().getLineContent(lineNumber) + '\n';
          }
        }
        if (value === '') {
          message.info(intl.get('console.selectEmpty'));
          return;
        }
        handleRun(value);
      },
    });
    setHistoryProvider();
  };
  const handleEditorChange = useCallback((value: string) => update({ currentGQL: value }), []);
  const handleSwitchSpace = useCallback(async (space: string) => {
    setEditorLoading(true);
    try {
      await updateCurrentSpace(space);
      const data = await schema.getSchemaTree(space);
      data && setSchemaTree(data);
    } finally {
      setEditorLoading(false);
    }
  }, []);

  useEffect(() => {
    !runGQLLoading && resultContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [runGQLLoading]);

  return (
    <div className={styles.nebulaConsole}>
      <SchemaDrawer />
      <div className={styles.consoleContainer} ref={resultContainerRef}>
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
                  onChange={handleSwitchSpace}
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
                <Button type="primary" onClick={() => handleRun()} loading={runGQLLoading}>
                  <Icon type="icon-studio-btn-play" />
                  {intl.get('common.run')}
                </Button>
              </div>
            </div>
          </div>
          <Spin spinning={editorLoading || runGQLLoading} delay={200}>
            <div className={styles.codeInput}>
              <CypherParameterBox onSelect={addParam} data={paramsMap} />
              <MonacoEditor
                onInstanceChange={onInstanceMount}
                schema={schemaTree}
                value={currentGQL}
                onChange={handleEditorChange}
                onShiftEnter={handleRun}
                height="100%"
                className={styles.monacoEditor}
              />
            </div>
          </Spin>
        </div>
        <div className={styles.resultContainer}>
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
      {/* <NgqlDrawer onItemClick={(v) => updateGql(currentGQL + v)} /> */}
      {modalVisible && (
        <ExportModal
          visible={modalVisible}
          data={modalData}
          onClose={() => setModalVisible(false)}
          onExplorer={handleExplorer}
        />
      )}
      <LLMBot />
    </div>
  );
};

export default observer(Console);
