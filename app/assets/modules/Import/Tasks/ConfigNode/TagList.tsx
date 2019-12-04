import { Button } from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

import Tag from './Tag';
import './TagList.less';

const mapState = (state: IRootState) => ({
  activeVertexIndex: state.importData.activeVertexIndex,
  vertexesConfig: state.importData.vertexesConfig,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateVertexesConfig: config => {
    dispatch.importData.update({
      vertexesConfig: config,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class TagList extends React.Component<IProps> {
  handlerAddTag = () => {
    const { vertexesConfig, activeVertexIndex } = this.props;
    const vertex = vertexesConfig[activeVertexIndex];

    vertex.tags.push({
      name: '',
      props: [],
    });
    this.props.updateVertexesConfig([...vertexesConfig]);
  };

  render() {
    const { vertexesConfig, activeVertexIndex } = this.props;
    const vertex = vertexesConfig[activeVertexIndex];

    return (
      <div className="tag-list-wrap">
        <div className="tag-list">
          {vertex.tags.map((tag, index) => (
            <Tag data={tag} index={index} key={tag.name || index} />
          ))}
        </div>
        <div className="operation">
          <Button type="default" onClick={this.handlerAddTag}>
            + Tag
          </Button>
        </div>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(TagList);
