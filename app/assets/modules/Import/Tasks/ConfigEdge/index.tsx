import { Button, Icon, Tabs } from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import CSVPreviewLink from '#assets/components/CSVPreviewLink';
import { IDispatch, IRootState } from '#assets/store';
import { trackPageView } from '#assets/utils/stat';

import Add, { AddType } from '../Add';
import Next from '../Next';
import Edge from './Edge';
import './index.less';

const { TabPane } = Tabs;

const mapState = (state: IRootState) => ({
  edgesConfig: state.importData.edgesConfig,
  activeEdgeIndex: state.importData.activeEdgeIndex,
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
  space: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateActiveEdgeIndex: edgeIndex => {
    dispatch.importData.update({
      activeEdgeIndex: edgeIndex,
    });
  },
  deleteEdgeConfig: edgeName => {
    dispatch.importData.deleteEdgeConfig({ edgeName });
  },
  asyncGetEdgeTypes: dispatch.nebula.asyncGetEdgeTypes,
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
    const { username, host, password, space } = this.props;
    this.props.asyncGetEdgeTypes({
      username,
      host,
      password,
      space,
    });
    trackPageView('/import/configEdge');
  }

  render() {
    const { edgesConfig, activeEdgeIndex } = this.props;

    return (
      <div className="edge-config-task task">
        <div className="edges">
          <h3>Edge Types</h3>
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
                    <Button
                      type="link"
                      onClick={e => {
                        e.stopPropagation();
                        this.props.deleteEdgeConfig(edge.name);
                      }}
                    >
                      <Icon type="close" />
                    </Button>
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
        <Next />
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(ConfigEdge);
