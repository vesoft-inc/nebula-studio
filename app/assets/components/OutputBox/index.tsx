import { Alert, Button, Icon, Table, Tabs } from 'antd';
import { BigNumber } from 'bignumber.js';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { Modal, OutputCsv } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';
import { parseSubGraph } from '#assets/utils/parseData';
import { trackEvent } from '#assets/utils/stat';

import Export from './Export';
import Graphviz from './Graphviz';
import './index.less';

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    RouteComponentProps {
  value: string;
  result: any;
  onHistoryItem: (value: string) => void;
}

const mapState = (state: IRootState) => ({
  spaceVidType: state.nebula.spaceVidType,
});

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
    if (
      result.data.tables.filter(
        item =>
          item._verticesParsedList ||
          item._edgesParsedList ||
          item._pathsParsedList,
      ).length > 0
    ) {
      this.parseToGraph();
    } else {
      if (this.importNodesHandler) {
        this.importNodesHandler.show();
      }
    }
  };

  parseToGraph = () => {
    const {
      result: {
        data: { tables },
      },
    } = this.props;
    const { spaceVidType } = this.props;
    const { vertexes, edges } = parseSubGraph(tables, spaceVidType);
    this.props.updatePreloadData({
      vertexes: _.uniq(vertexes),
      edges: _.uniqBy(edges, (e: any) => e.id),
    });
    this.props.history.push('/explore');
    trackEvent('navigation', 'view_explore', 'from_console_btn');
  };

  handleTabChange = async key => {
    trackEvent('console', `change_tab_${key}`);
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
                BigNumber.isBigNumber(value)
              ) {
                return value.toString();
              }
              return value;
            },
          };
        });
        showSubgraphs =
          dataSource.filter(
            item =>
              item._verticesParsedList ||
              item._edgesParsedList ||
              item._pathsParsedList,
          ).length > 0;
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
          <Tabs
            defaultActiveKey={'log'}
            size={'large'}
            tabPosition={'left'}
            onChange={this.handleTabChange}
          >
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
                  pagination={{
                    showTotal: () =>
                      `${intl.get('common.total')} ${dataSource.length}`,
                  }}
                  rowKey={(_, index) => index.toString()}
                />
              </Tabs.TabPane>
            )}
            {result.code === 0 && result.data.headers[0] === 'format' && (
              <Tabs.TabPane
                tab={
                  <>
                    <Icon type="share-alt" />
                    {intl.get('common.graph')}
                  </>
                }
                key="graph"
              >
                {<Graphviz graph={dataSource[0].format} />}
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
        {result.code === 0 && result.data.timeCost !== undefined && (
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
