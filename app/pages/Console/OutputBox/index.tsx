import { Table, Tabs, Tooltip } from 'antd';
import { BigNumber } from 'bignumber.js';
import React, { useCallback, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackEvent } from '@app/utils/stat';
import { v4 as uuidv4 } from 'uuid';
import Icon from '@app/components/Icon';
import Graphviz from './Graphviz';

import './index.less';
import classNames from 'classnames';

interface IProps {
  index: number;
  gql: string;
  result: any;
  onHistoryItem: (gql: string) => void;
}

const OutputBox = (props: IProps) => {
  const { gql, result: { code, data, message }, onHistoryItem, index } = props;
  const { global, console } = useStore();
  const [visible, setVisible] = useState(true);
  const { username, host } = global;
  const { results, update, favorites, updateFavorites } = console;
  const [columns, setColumns] = useState<any>([]);
  const [dataSource, setDataSource] = useState<any>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const initData = () => {
    let _columns = [] as any;
    let _dataSource = [] as any;
    if(!data) {
      return;
    }
    const { headers, tables, localParams } = data;
    if (tables.length > 0) {
      _dataSource = data.tables;
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
    trackEvent('console', `change_tab_${key}`);
  }, []);

  const addFavorites = () => {
    if(!gql) {
      return;
    }
    const _favorites = { ...favorites };
    if (_favorites[username] && _favorites[username][host]) {
      _favorites[username][host].push(gql);
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

  const downloadData = () => {
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <Tooltip title={intl.get('common.download')} placement="top">
          <Icon
            type="icon-studio-btn-download"
            onClick={downloadData}
          />
        </Tooltip>
        {visible ? <Icon
          type="icon-studio-btn-up"
          onClick={() => setVisible(false)}
        /> : <Icon
          type="icon-studio-btn-down"
          onClick={() => setVisible(true)}
        />}
        <Icon
          type="icon-studio-btn-close"
          onClick={handleItemRemove}
        />
      </div>
    </div>
    {visible && <> 
      <div className="tab-container">
        <Tabs
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
              {message}
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
        </div>
      )}
    </>}
  </div>;
};

export default observer(OutputBox);
