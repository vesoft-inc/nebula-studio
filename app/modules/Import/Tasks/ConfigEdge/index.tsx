import { Button, Popconfirm, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { CloseOutlined } from '@ant-design/icons';

import Add, { AddType } from '../Add';
import Next from '../Next';
import Prev from '../Prev';
import Edge from './Edge';
import { trackPageView } from '#app/utils/stat';
import { IDispatch, IRootState } from '#app/store';
import CSVPreviewLink from '#app/components/CSVPreviewLink';
import './index.less';

const { TabPane } = Tabs;

const mapState = (state: IRootState) => {
  return {
    edgesConfig: state.importData.edgesConfig,
    activeEdgeIndex: state.importData.activeEdgeIndex,
  };
};

const mapDispatch = (dispatch: IDispatch) => ({
  updateActiveEdgeIndex: edgeIndex => {
    dispatch.importData.update({
      activeEdgeIndex: edgeIndex,
    });
  },
  deleteEdgeConfig: edgeName => {
    dispatch.importData.deleteEdgeConfig({ edgeName });
  },
  asyncGetEdges: dispatch.nebula.asyncGetEdges,
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {}

class ConfigEdge extends React.Component<IProps> {
  handleTabClick = key => {
    const index = Number(key.split('#')[1]);
    this.props.updateActiveEdgeIndex(index);
  };

  componentDidMount() {
    this.props.asyncGetEdges();
    trackPageView('/import/configEdge');
  }

  render() {
    const { edgesConfig, activeEdgeIndex } = this.props;

    return (
      <div className="edge-config-task task">
        <div className="edges">
          <div className="operation">
            <Add type={AddType.edge} />
          </div>
          <Tabs
            className="edge-tabs"
            activeKey={`${edgesConfig[activeEdgeIndex] &&
              edgesConfig[activeEdgeIndex].name}#${activeEdgeIndex}`}
            onTabClick={this.handleTabClick}
          >
            {edgesConfig.map((edge, index) => (
              <TabPane
                tab={
                  <p className="tab-content">
                    {edge.name}
                    <Popconfirm
                      title={intl.get('common.ask')}
                      onConfirm={(e: any) => {
                        e.stopPropagation();
                        this.props.deleteEdgeConfig(edge.name);
                      }}
                      okText={intl.get('common.ok')}
                      cancelText={intl.get('common.cancel')}
                    >
                      <Button
                        type="link"
                        onClick={e => {
                          e.stopPropagation();
                        }}
                      >
                        <CloseOutlined />
                      </Button>
                    </Popconfirm>
                  </p>
                }
                key={`${edge.name}#${index}`}
              >
                <span className="csv-file">
                  File:
                  <CSVPreviewLink file={edge.file}>
                    {edge.file.name}
                  </CSVPreviewLink>
                  <Edge />
                </span>
              </TabPane>
            ))}
          </Tabs>
        </div>
        <div className="btns-import-step">
          <Prev />
          <Next />
        </div>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(ConfigEdge);
