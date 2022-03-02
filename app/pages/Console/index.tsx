import { Button, Select, Tooltip, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { trackPageView } from '@app/utils/stat';
import { useStore } from '@app/stores';
import Instruction from '@app/components/Instruction';
import Icon from '@app/components/Icon';
import OutputBox from './OutputBox';
import CodeMirror from '@app/components/CodeMirror';
import { maxLineNum } from '@app/config/nebulaQL';
import HistoryBtn from './HistoryBtn';
import FavoriteBtn from './FavoriteBtn';
import CypherParameterBox from './CypherParameterBox';
import './index.less';
const Option = Select.Option;

// split from semicolon out of quotation marks
const SEMICOLON_REG = /((?:[^;'"]*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')[^;'"]*)+)|;/;

const getHistory = () => {
  const value: string | null = localStorage.getItem('history');
  if (value && value !== 'undefined' && value !== 'null') {
    return JSON.parse(value).slice(-15);
  }
  return [];
};

const Console = () => {
  const { schema, console, global } = useStore();
  const { spaces, getSpaces, switchSpace, currentSpace } = schema;
  const { runGQL, currentGQL, results, runGQLLoading, getParams, update, paramsMap } = console;
  const { username, host } = global;
  const [isUpDown, setUpDown] = useState(false);
  const editor = useRef<any>(null);
  useEffect(() => {
    trackPageView('/console');
    getSpaces();
    getParams();
  }, []);

  
  const checkSwitchSpaceGql = (query: string) => {
    const queryList = query.split(SEMICOLON_REG).filter(Boolean);
    const reg = /^USE `?[0-9a-zA-Z_]+`?(?=[\s*;?]?)/gim;
    if (queryList.some(sentence => sentence.trim().match(reg))) {
      return intl.get('common.disablesUseToSwitchSpace');
    }
  };

  const handleLineCount = () => {
    let line;
    const editorLine = editor.current!.editor.lineCount();
    if (editorLine > maxLineNum) {
      line = maxLineNum;
    } else if (editorLine < 5) {
      line = 5;
    } else {
      line = editorLine;
    }
    editor.current!.editor.setSize(undefined, `${line * 24 + 10}px`);
  };

  const updateGql = (value: string) => update({ currentGQL: value });

  const handleSaveQuery = (query: string) => {
    if (query !== '') {
      const history = getHistory();
      history.push(query);
      localStorage.setItem('history', JSON.stringify(history));
    }
  };

  const handleRun = async() => {
    if(editor.current) {
      const query = editor.current!.editor.getValue();
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
      await runGQL(query);
      setUpDown(true);
    }
  };

  const addParam = (param: string) => {
    update({ currentGQL: currentGQL + ` $${param}` });
  };
  return (
    <div className="nebula-console">
      <div className="space-select">
        <span className="label">{intl.get('common.currentSpace')}</span>
        <Select value={currentSpace} onChange={value => switchSpace(value)}>
          {spaces.map(space => (
            <Option value={space} key={space}>
              {space}
            </Option>
          ))}
        </Select>
        <Instruction description={intl.get('common.spaceTip')} />
      </div>
      <div className="center-layout">
        <div className="console-panel">
          <div className="panel-header">
            <span className="title">Nebula Console</span>
            <div className="operations">
              <FavoriteBtn onGqlSelect={updateGql} username={username} host={host} />
              <HistoryBtn onGqlSelect={updateGql} />
              <Tooltip title={intl.get('common.empty')} placement="top">
                <Icon className="btn-operations" type="icon-studio-btn-clear" onClick={() => update({ currentGQL: '' })} />
              </Tooltip>
              <Button type="primary" onClick={handleRun} loading={runGQLLoading}>
                <Icon type="icon-studio-btn-play" />
                {intl.get('common.run')} 
              </Button>
            </div>
          </div>
          <div className="code-input">
            <CypherParameterBox onSelect={addParam} data={paramsMap} />
            <CodeMirror
              value={currentGQL}
              onBlur={value => update({ currentGQL: value })}
              onChangeLine={handleLineCount}
              ref={editor}
              height={isUpDown ? '120px' : 24 * maxLineNum + 'px'}
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
          {results.length > 0 ? results.map((item, index) => (
            <OutputBox
              key={item.id}
              index={index}
              result={item}
              gql={item.gql}
              onHistoryItem={gql => updateGql(gql)}
            />
          )) : <OutputBox
            key="empty"
            index={0}
            result={{ code: 0, data: { headers: [], tables: [] } }}
            gql={''}
            onHistoryItem={gql => updateGql(gql)}
          />}
        </div>
      </div>
    </div>
  );
};
export default observer(Console);
