import { Button, Table, Tabs, Tooltip, Popover } from 'antd';
import { BigNumber } from 'bignumber.js';
import React, { useCallback, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackEvent } from '@app/utils/stat';
import { v4 as uuidv4 } from 'uuid';
import Icon from '@app/components/Icon';
import { parseSubGraph } from '@app/utils/parseData';
import classNames from 'classnames';
import { GraphStore } from '@app/stores/graph';
import Graphviz from './Graphviz';
import ForceGraph from './ForceGraph';

import './index.less';

interface IProps {
  index: number;
  gql: string;
  result: any;
  onHistoryItem: (gql: string) => void;
  onExplorer?: (params: {
    space: string;
    vertexes: any[], 
    edges: any[]
  }) => void;
  onResultConfig?: (data: any) => void
}

const OutputBox = (props: IProps) => {
  const { gql, result: { code, data, message }, onHistoryItem, index, onExplorer, onResultConfig } = props;
  const { global, console, schema } = useStore();
  const [visible, setVisible] = useState(true);
  const { username, host } = global;
  const { results, update, favorites, updateFavorites } = console;
  const { spaceVidType, currentSpace } = schema;
  const [columns, setColumns] = useState<any>([]);
  const [dataSource, setDataSource] = useState<any>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graph, setGraph] = useState<GraphStore | null>(null);
  const [tab, setTab] = useState('');
  const initData = () => {
    let _columns = [] as any;
    let _dataSource = [] as any;
    if(!data) {
      return;
    }
    const { headers, tables, localParams } = data;
    if (tables.length > 0) {
      _dataSource = data.tables;
      setShowGraph(_dataSource.filter(item => 
        item._verticesParsedList ||
        item._edgesParsedList ||
        item._pathsParsedList).length > 0);
    } 
    if(headers.length > 0) {
      _columns = data.headers.map(column => {
        return {
          title: column,
          dataIndex: column,
          sorter: (r1, r2) => {
            const v1 = r1[column];
            const v2 = r2[column];
            return v1 === v2 ? 0 : v1 > v2 ? 1 : -1;
          },
          sortDirections: ['descend', 'ascend'],
          render: value => {
            if (typeof value === 'boolean') {
              return value.toString();
            } else if (
              typeof value === 'number' ||
              BigNumber.isBigNumber(value)
            ) {
              return value.toString();
            }
            return value;
          },
        };
      });
    }
    if (localParams) {
      const params = {};
      Object.entries(data?.localParams).forEach(
        ([k, v]) => (params[k] = JSON.stringify(v)),
      );
      _dataSource = [{ ...params }];
      _columns = Object.keys(data?.localParams).map(column => {
        return {
          title: column,
          dataIndex: column,
          render: value => {
            if (typeof value === 'boolean') {
              return value.toString();
            } else if (
              typeof value === 'number' ||
              BigNumber.isBigNumber(value)
            ) {
              return value.toString();
            }
            return value;
          },
        };
      });
    }
    setDataSource(_dataSource);
    setColumns(_columns);
  };
  
  useEffect(() => {
    initData();
  }, []);

  const handleTabChange = useCallback(key => {
    setTab(key);
    trackEvent('console', `change_tab_${key}`);
  }, []);

  const addFavorites = () => {
    if(!gql) {
      return;
    }
    const _favorites = { ...favorites };
    if (_favorites[username] && _favorites[username][host]) {
      _favorites[username][host].unshift(gql);
    } else {
      _favorites[username] = {
        [host]: [gql],
      };
    }
    updateFavorites(_favorites);
  };
  const removeFavorite = () => {
    const _favorites = { ...favorites };
    _favorites[username][host].splice(index, 1);
    updateFavorites(_favorites);
  };

  useEffect(() => { 
    if(gql && favorites[username] && favorites[username][host]) {
      setIsFavorited(favorites[username][host].includes(gql));
    }
  }, [favorites, gql]);

  const handleItemRemove = () => {
    update({
      results: results.filter((_, i) => i !== index)
    });
  };

  const downloadCsv = () => {
    if (!data) {
      return ;
    }
    let url = '#';
    const { headers = [], tables = [] } = data;
    const csv = [
      headers,
      ...tables.map(values => headers.map(field => values[field])),
    ]
      .map(row =>
        // HACK: waiting for use case if there need to check int or string
        row.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
    if (!csv) {
      return;
    }

    const _utf = '\uFEFF';
    if (window.Blob && window.URL && window.URL.createObjectURL) {
      const csvBlob = new Blob([_utf + csv], {
        type: 'text/csv',
      });
      url = URL.createObjectURL(csvBlob);
    }
    url = 'data:attachment/csv;charset=utf-8,' + _utf + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.href = url;
    link.download = `result.csv`;
    link.click();
  };

  const downloadPng = () => {
    if(graph) {
      let canvas = graph.twoGraph.canvas;
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = canvas.width;
      shadowCanvas.height = canvas.height;
      const ctx = shadowCanvas.getContext('2d');
      ctx.fillStyle = '#F3F6F9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(canvas, 0, 0);
      canvas = shadowCanvas;
      setTimeout(() => {
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = 'Image.png';
          a.click();
          window.URL.revokeObjectURL(url);
        });
      }, 0);
    }
    trackEvent('console', 'export_graph_png');
  };

  const handleExplore = () => {
    if (
      data.tables.filter(
        item =>
          item._verticesParsedList ||
          item._edgesParsedList ||
          item._pathsParsedList,
      ).length > 0
    ) {
      parseToGraph();
    } else {
      onResultConfig!(data);
    }
  };

  const parseToGraph = () => {
    const { vertexes, edges } = parseSubGraph(data.tables, spaceVidType);
    onExplorer!({
      space: currentSpace,
      vertexes, 
      edges
    });
  };

  return <div className="output-box">
    <div className="output-header">
      <p className={classNames('gql', { 'error-info': code !== 0 })} onClick={() => onHistoryItem(gql)}>
        $ {gql}
      </p>
      <div className="output-operations">
        {!isFavorited ? <Tooltip title={intl.get('console.addToFavorites')} placement="top">
          <Icon
            type="icon-studio-btn-save"
            onClick={addFavorites}
          />
        </Tooltip> : <Tooltip title={intl.get('console.unfavorite')} placement="top">
          <Icon
            className="btn-yellow"
            type="icon-studio-btn-save-fill"
            onClick={removeFavorite}
          />
        </Tooltip>}
        <Popover
          overlayClassName="export-popover"
          placement="bottom"
          content={<>
            <Button type="link" className="download-item" onClick={downloadCsv}>
              {intl.get('schema.csvDownload')}
            </Button>
            <Button disabled={!graph || tab !== 'graph'} type="link" className="download-item" onClick={downloadPng}>
              {intl.get('schema.pngDownload')}
            </Button>
          </>}
        >
          <Icon className="btn-export" type="icon-studio-btn-output" />
        </Popover>
        <Icon
          className="icon-toggle"
          type={visible ? 'icon-studio-btn-up' : 'icon-studio-btn-down'}
          onClick={() => setVisible(!visible)}
        />
        <Icon
          type="icon-studio-btn-close"
          onClick={handleItemRemove}
        />
      </div>
    </div>
    {visible && <> 
      <div className="tab-container">
        <Tabs
          className="output-tab"
          defaultActiveKey={'log'}
          size={'large'}
          tabPosition={'left'}
          onChange={handleTabChange}
        >
          {code === 0 && (
            <Tabs.TabPane
              tab={
                <>
                  <Icon type="icon-studio-console-table" />
                  {intl.get('common.table')}
                </>
              }
              key="table"
            >
              <Table
                bordered={true}
                columns={columns}
                dataSource={dataSource}
                pagination={{
                  showTotal: () =>
                    `${intl.get('common.total')} ${dataSource.length}`,
                }}
                rowKey={() => uuidv4()}
              />
            </Tabs.TabPane>
          )}
          {code === 0 && data.headers[0] === 'format' && (
            <Tabs.TabPane
              tab={
                <>
                  <Icon type="icon-studio-console-graphviz" />
                  {intl.get('console.graphviz')}
                </>
              }
              key="graph"
            >
              {<Graphviz graph={dataSource[0]?.format} />}
            </Tabs.TabPane>
          )}
          {showGraph && (
            <Tabs.TabPane
              tab={
                <>
                  <Icon type="icon-studio-console-graph" />
                  {intl.get('common.graph')}
                </>
              }
              key="graph"
            >
              <ForceGraph data={dataSource} spaceVidType={spaceVidType} onGraphInit={setGraph} />
            </Tabs.TabPane>
          )}
          {code !== 0 && (
            <Tabs.TabPane
              tab={
                <>
                  <Icon type="icon-studio-console-logs" />
                  {intl.get('common.log')}
                </>
              }
              key="log"
            >
              <div className="err-container">{message}</div>
            </Tabs.TabPane>
          )}
        </Tabs>
      </div>
      {code === 0 && data.timeCost !== undefined && (
        <div className="output-footer">
          <span>
            {`${intl.get('console.execTime')} ${data.timeCost /
              1000000} (s)`}
          </span>
          {onExplorer && <Button className="primary-btn" type="text" onClick={handleExplore}>{intl.get('common.openInExplore')}</Button>}
        </div>
      )}
    </>}
  </div>;
};

export default observer(OutputBox);
