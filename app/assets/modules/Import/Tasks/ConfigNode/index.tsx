import { Button, Icon, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import CSVPreviewLink from '#assets/components/CSVPreviewLink';
import { IDispatch, IRootState } from '#assets/store';

import Add, { AddType } from '../Add';
import './index.less';
import TagList from './TagList';

const { TabPane } = Tabs;

const mapState = (state: IRootState) => ({
  vertexesConfig: state.importData.vertexesConfig,
  activeVertexIndex: state.importData.activeVertexIndex,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateVertexesConfig: config =>
    dispatch.importData.update({
      vertexesConfig: config,
    }),
  updateActiveVertexIndex: vertexIndex => {
    dispatch.importData.update({
      activeVertexIndex: vertexIndex,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class ConfigNode extends React.PureComponent<IProps> {
  handleDelete = vertexName => {
    const { vertexesConfig, activeVertexIndex } = this.props;
    const newVertexesConfig = vertexesConfig.filter(
      config => config.name !== vertexName,
    );

    this.props.updateVertexesConfig(newVertexesConfig);
    if (
      vertexesConfig[activeVertexIndex] &&
      vertexesConfig[activeVertexIndex].name === vertexName
    ) {
      if (newVertexesConfig.length === 0) {
        this.props.updateActiveVertexIndex(-1);
      } else {
        this.props.updateActiveVertexIndex(0);
      }
    }
  };

  handleTabClick = key => {
    const index = Number(key.split('#')[1]);
    this.props.updateActiveVertexIndex(index);
  };

  render() {
    const { vertexesConfig, activeVertexIndex } = this.props;

    return (
      <div className="vertex-config task">
        <div className="vertexes">
          <h3>Vertexes</h3>
          <div className="operation">
            <Add type={AddType.vertex} />
          </div>
          <Tabs
            className="vertex-tabs"
            activeKey={`${vertexesConfig[activeVertexIndex] &&
              vertexesConfig[activeVertexIndex].name}#${activeVertexIndex}`}
            onTabClick={this.handleTabClick}
          >
            {vertexesConfig.map((vertex, index) => (
              <TabPane
                tab={
                  <p className="tab-content">
                    {vertex.name}
                    <Button
                      type="link"
                      onClick={e => {
                        e.stopPropagation();
                        this.handleDelete(vertex.name);
                      }}
                    >
                      <Icon type="close" />
                    </Button>
                  </p>
                }
                key={`${vertex.name}#${index}`}
              >
                <span className="csv-file">
                  File:
                  <CSVPreviewLink file={vertex.file}>
                    {vertex.file.name}
                  </CSVPreviewLink>
                </span>
                {index === activeVertexIndex ? <TagList /> : null}
              </TabPane>
            ))}
          </Tabs>
        </div>
        <Button type="primary" className="next">
          {intl.get('import.next')}
        </Button>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(ConfigNode);
