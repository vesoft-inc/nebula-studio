import { Button, Popconfirm, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { CloseOutlined } from '@ant-design/icons';


import Add, { AddType } from '../Add';
import Next from '../Next';
import Prev from '../Prev';
import './index.less';
import TagList from './TagList';
import { trackPageView } from '#app/utils/stat';
import { IDispatch, IRootState } from '#app/store';
import CSVPreviewLink from '#app/components/CSVPreviewLink';

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
  deleteVertexConfig: vertexName => {
    dispatch.importData.deleteVertexConfig({
      vertexName,
    });
  },
  asyncGetTags: dispatch.nebula.asyncGetTags,
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

class ConfigNode extends React.PureComponent<IProps> {
  handleTabClick = key => {
    const index = Number(key.split('#')[1]);
    this.props.updateActiveVertexIndex(index);
  };

  componentDidMount() {
    this.props.asyncGetTags();
    trackPageView('/import/configVertex');
  }

  render() {
    const { vertexesConfig, activeVertexIndex } = this.props;
    return (
      <div className="vertex-config task">
        <div className="vertexes">
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
                    <Popconfirm
                      title={intl.get('common.ask')}
                      onConfirm={() => {
                        this.props.deleteVertexConfig(vertex.name);
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
        <div className="btns-import-step">
          <Prev />
          <Next />
        </div>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(ConfigNode);
