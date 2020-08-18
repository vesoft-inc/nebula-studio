import { Alert, Button, Icon, Table, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';

import { OutputCsv } from '#assets/components';

import './index.less';

interface IProps extends RouteComponentProps {
  value: string;
  result: any;
  onHistoryItem: (value: string) => void;
  onVertexesPreload: (value: string[]) => void;
}

interface IState {
  sorter: any;
  ids: string[];
}

class OutputBox extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      sorter: null,
      ids: [],
    };
  }

  handleTableChange = (_1, _2, sorter) => {
    this.setState({
      sorter,
    });
  };

  outputClass = (code: any) => {
    if (code !== undefined) {
      if (code === 0) {
        return 'success';
      }
      return 'error';
    }
    return 'info';
  };
  componentDidMount() {
    if (this.props.result && this.props.result.code === 0) {
      this.fetchIds(this.props.result.data);
    }
  }
  componentDidUpdate(prevProps) {
    if (
      !_.isEqual(prevProps.result, this.props.result) &&
      this.props.result.code === 0
    ) {
      this.fetchIds(this.props.result.data);
    }
  }

  fetchIds(data) {
    // TODO support alias
    const reg = /^\w+._(dst|src)$/;
    let ids = [];
    if (data.headers.includes('VertexID')) {
      ids = data.tables.map(i => i.VertexID).filter(i => i !== undefined);
    } else {
      data.headers.forEach(i => {
        // HACK: nebula1.0 return 0 if there is no dstid, it'll be fixed in nbula2.0
        if (reg.test(i)) {
          const newIds = data.tables
            .map(el => el[i])
            .filter(i => i !== undefined && i !== '0');
          ids = ids.concat(newIds);
        }
      });
    }
    ids = _.uniq(ids);
    this.setState({
      ids,
    });
  }

  render() {
    const { value, result = {} } = this.props;
    const { sorter, ids } = this.state;
    let columns = [];
    let dataSource = [];
    if (result.code === 0) {
      if (result.data && result.data.headers) {
        columns = result.data.headers.map(column => {
          return {
            title: column,
            dataIndex: column,
            sorter: true,
            sortDirections: ['descend', 'ascend'],
            render: value => {
              if (typeof value === 'boolean') {
                return value.toString();
              }
              return value;
            },
          };
        });
      }

      if (result.data && result.data.tables) {
        dataSource = result.data.tables;
        if (sorter) {
          switch (sorter.order) {
            case 'descend':
              dataSource = result.data.tables.sort((r1, r2) => {
                const field = sorter.field;
                const v1 = r1[field];
                const v2 = r2[field];
                return v1 === v2 ? 0 : v1 < v2 ? 1 : -1;
              });
              break;
            case 'ascend':
              dataSource = result.data.tables.sort((r1, r2) => {
                const field = sorter.field;
                const v1 = r1[field];
                const v2 = r2[field];
                return v1 === v2 ? 0 : v1 > v2 ? 1 : -1;
              });
              break;
          }
        }
      }
    }
    return (
      <div className="output-box">
        <Alert
          message={
            <p className="gql" onClick={() => this.props.onHistoryItem(value)}>
              $ {value}
            </p>
          }
          className="output-value"
          type={this.outputClass(result.code)}
        />
        <div className="tab-container">
          <Tabs defaultActiveKey={'log'} size={'large'} tabPosition={'left'}>
            {result.code === 0 && (
              <Tabs.TabPane
                tab={
                  <>
                    <Icon type="table" />
                    {intl.get('common.table')}
                  </>
                }
                key="table"
              >
                <div className="operation">
                  <OutputCsv
                    tableData={{
                      headers: result.data && result.data.headers,
                      tables: dataSource,
                    }}
                  />
                  {ids.length > 0 && (
                    <Button
                      type="primary"
                      style={{ marginLeft: '10px' }}
                      onClick={() => this.props.onVertexesPreload(ids)}
                    >
                      <Link to="/explore" className="btn-link">
                        {intl.get('common.openInExplore')}
                      </Link>
                    </Button>
                  )}
                </div>
                <Table
                  bordered={true}
                  columns={columns}
                  dataSource={dataSource}
                  rowKey={(_, index) => index.toString()}
                  onChange={this.handleTableChange}
                />
              </Tabs.TabPane>
            )}
            {result.code !== 0 && (
              <Tabs.TabPane
                tab={
                  <>
                    <Icon type="alert" />
                    {intl.get('common.log')}
                  </>
                }
                key="log"
              >
                {result.message}
              </Tabs.TabPane>
            )}
          </Tabs>
        </div>
        {result.code === 0 && result.data.timeCost && (
          <div className="output-footer">
            <span>
              {`${intl.get('console.execTime')} ${result.data.timeCost /
                1000000} (s)`}
            </span>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(OutputBox);
