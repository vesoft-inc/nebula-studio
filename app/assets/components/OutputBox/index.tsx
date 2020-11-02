import { Alert, Button, Icon, Table, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { Modal, OutputCsv } from '#assets/components';
import { IDispatch } from '#assets/store';

import Export from './Export';
import './index.less';

interface IProps extends ReturnType<typeof mapDispatch>, RouteComponentProps {
  value: string;
  result: any;
  onHistoryItem: (value: string) => void;
}

interface IState {
  sorter: any;
}

const mapState = () => ({});

const mapDispatch = (dispatch: IDispatch) => ({
  updatePreloadData: data =>
    dispatch.explore.update({
      preloadData: data,
    }),
});
class OutputBox extends React.Component<IProps, IState> {
  importNodesHandler;
  constructor(props) {
    super(props);

    this.state = {
      sorter: null,
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

  handleExplore = () => {
    const { result = {} } = this.props;
    if (result.data && result.data.headers.includes('_path_')) {
      this.parsePathToGraph();
    } else {
      if (this.importNodesHandler) {
        this.importNodesHandler.show();
      }
    }
  };

  parsePathToGraph = () => {
    const { result } = this.props;
    const edgeReg = /^\<[a-zA-Z0-9_]+,\d+\>$/;
    const pathes = result.data.tables.map(i => i._path_);
    const exportData = pathes.map(path => {
      const list = path.split(' ');
      const vertexes: any = [];
      const edges: any = [];
      list.forEach((item, index) => {
        if (edgeReg.test(item)) {
          const [edgeType, rank] = item.replace(/[\<|\>|\s*]/g, '').split(',');
          edges.push({
            srcId: list[index - 1],
            dstId: list[index + 1],
            edgeType,
            rank,
            id: `${edgeType} ${list[index - 1]}->${list[index + 1]}@${rank}}`,
          });
        } else {
          vertexes.push(item);
        }
      });
      return {
        vertexes,
        edges,
      };
    });
    const vertexes = exportData.map(i => i.vertexes).flat();
    const edges = exportData.map(i => i.edges).flat();
    this.props.updatePreloadData({
      vertexes,
      edges: _.uniqBy(edges, (e: any) => e.id),
    });
    this.props.history.push('/explore');
  };

  render() {
    const { value, result = {} } = this.props;
    const { sorter } = this.state;
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
                  <Button
                    type="primary"
                    style={{ marginLeft: '10px' }}
                    onClick={this.handleExplore}
                  >
                    {result.data.headers.includes('_path_')
                      ? intl.get('console.showSubgraphs')
                      : intl.get('common.openInExplore')}
                  </Button>
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
        <Modal
          className="export-node-modal"
          handlerRef={handler => (this.importNodesHandler = handler)}
          footer={null}
          width="650px"
        >
          <Export data={result.data} />
        </Modal>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(withRouter(OutputBox));
