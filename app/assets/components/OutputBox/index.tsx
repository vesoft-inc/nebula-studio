import { Alert, Button, Icon, Table, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { Modal, OutputCsv } from '#assets/components';
import { IDispatch } from '#assets/store';
import { handleVidStringName } from '#assets/utils/function';

import Export from './Export';
import './index.less';

interface IProps extends ReturnType<typeof mapDispatch>, RouteComponentProps {
  value: string;
  result: any;
  onHistoryItem: (value: string) => void;
}

const mapState = () => ({});

const mapDispatch = (dispatch: IDispatch) => ({
  updatePreloadData: data =>
    dispatch.explore.update({
      preloadData: data,
    }),
});
class OutputBox extends React.Component<IProps> {
  importNodesHandler;
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
    if (result.data.headers.includes('path')) {
      this.parseToGraph('path');
    } else if (
      result.data.headers.includes('_vertices') &&
      result.data.headers.includes('_edges')
    ) {
      this.parseToGraph('subGraph');
    } else {
      if (this.importNodesHandler) {
        this.importNodesHandler.show();
      }
    }
  };

  parseToGraph = type => {
    const {
      result: {
        data: { tables },
      },
    } = this.props;
    const { vertexes, edges } =
      type === 'path'
        ? this.parsePathToGraph(tables)
        : this.parseSubGraph(tables);
    this.props.updatePreloadData({
      vertexes: _.uniq(vertexes),
      edges: _.uniqBy(edges, (e: any) => e.id),
    });
    this.props.history.push('/explore');
  };

  parseSubGraph = data => {
    const vertexes: any = [];
    const edges: any = [];
    data.forEach(row => {
      const { _edges_info: edgeList, _vertices_info: vertexList } = row;
      vertexList.forEach(vertex => {
        vertexes.push(vertex.vid);
      });
      edgeList.forEach(edge => {
        const { dstID: dstId, srcID: srcId, rank, edgeName: edgeType } = edge;
        edges.push({
          srcId,
          dstId,
          edgeType,
          rank,
          id: `${edgeType} ${handleVidStringName(srcId)}->${handleVidStringName(
            dstId,
          )}@${rank}}`,
        });
      });
    });
    return { vertexes, edges };
  };

  parsePathToGraph = data => {
    const vertexes: any = [];
    const edges: any = [];
    const relationships = data.map(i => i.relationships).flat();
    relationships.forEach(relationship => {
      const {
        srcID: srcId,
        dstID: dstId,
        edgeName: edgeType,
        rank,
      } = relationship;
      vertexes.push(srcId);
      vertexes.push(dstId);
      edges.push({
        srcId,
        dstId,
        edgeType,
        rank,
        id: `${edgeType} ${handleVidStringName(srcId)}->${handleVidStringName(
          dstId,
        )}@${rank}}`,
      });
    });
    return { vertexes, edges };
  };

  render() {
    const { value, result = {} } = this.props;
    let columns = [];
    let showSubgraphs = false;
    const dataSource =
      result.data && result.data.tables ? result.data.tables : [];
    if (result.code === 0) {
      if (result.data && result.data.headers) {
        columns = result.data.headers.map(column => {
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
                typeof value === 'bigint'
              ) {
                return value.toString();
              }
              return value;
            },
          };
        });
        showSubgraphs =
          result.data.headers.includes('path') ||
          (result.data.headers.includes('_vertices') &&
            result.data.headers.includes('_edges'));
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
                    {showSubgraphs
                      ? intl.get('console.showSubgraphs')
                      : intl.get('common.openInExplore')}
                  </Button>
                </div>
                <Table
                  bordered={true}
                  columns={columns}
                  dataSource={dataSource}
                  rowKey={(_, index) => index.toString()}
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
