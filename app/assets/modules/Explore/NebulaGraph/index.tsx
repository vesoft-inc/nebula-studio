import { Button } from 'antd';
import * as d3 from 'd3';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal, NebulaD3 } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';
import { IEdge, INode } from '#assets/store/models';

import './index.less';
import Panel from './Panel';
import Setting from './Setting';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
  selectVertexes: state.explore.selectVertexes,
  actionData: state.explore.actionData,
  space: state.nebula.currentSpace,
  tagsFields: state.nebula.tagsFields,
  edgesFields: state.nebula.edgesFields,
  tags: state.nebula.tags,
  edgeTypes: state.nebula.edgeTypes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSelectIds: (vertexes: INode[]) => {
    dispatch.explore.update({
      selectVertexes: vertexes,
    });
  },
  updateActionData: (actionData, edges, vertexes) => {
    dispatch.explore.update({
      actionData,
      edges,
      vertexes,
      selectVertexes: [],
    });
  },
  asyncGetTagsFields: dispatch.nebula.asyncGetTagsFields,
  asyncGetEdgeTypesFields: dispatch.nebula.asyncGetEdgeTypesFields,
  asyncBidirectExpand: dispatch.explore.asyncBidirectExpand,
});

interface IState {
  width: number;
  height: number;
  showTagFields: string[];
  showEdgeFields: string[];
  isTags: boolean;
}

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  onD3Ref: any;
}
class NebulaGraph extends React.Component<IProps, IState> {
  settingHandler;
  $tooltip;
  ref: HTMLDivElement;

  constructor(props: IProps) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      showTagFields: [],
      showEdgeFields: [],
      isTags: true,
    };
  }

  handleSelectVertexes = (nodes: any[]) => {
    this.props.updateSelectIds(nodes);
  };

  componentDidMount() {
    // render tootlip into dom
    const { clientWidth, clientHeight } = this.ref;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });

    this.$tooltip = d3
      .select(this.ref)
      .append('div')
      .attr('class', 'tooltip')
      .style('max-height', clientHeight)
      .style('overflow', 'auto');
    this.$tooltip
      .transition()
      .duration(200)
      .style('display', 'block')
      .style('opacity', '0.85')
      .style('top', 0)
      .style('left', 0);
    window.addEventListener('resize', this.handleResize);

    this.$tooltip.on('mouseout', this.handleMouseOut);
  }

  componentDidUpdate(prevProps) {
    const { space } = this.props;
    if (prevProps.space !== space) {
      this.setState({
        showTagFields: [],
        showEdgeFields: [],
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleMouseInNode = node => {
    const properties = node.nodeProp ? node.nodeProp.properties : {};
    const nodeFieldsValuePairStr = Object.keys(properties)
      .map(property => {
        const valueObj = properties[property];
        return Object.keys(valueObj)
          .map(fields => {
            return `<p key=${fields}>${property}.${fields}: ${valueObj[fields]}</p>`;
          })
          .join('');
      })
      .join('');
    this.$tooltip
      .html(
        `<p style="font-weight:600">Vertex Details</p> ${nodeFieldsValuePairStr}`,
      )
      .style('display', 'block');
  };

  handleMouseInLink = link => {
    const edgeFieldsValuePairStr = link.edgeProp
      ? link.edgeProp.tables
          .map(link => {
            return Object.keys(link)
              .map(attribute => {
                return `<p key=${attribute}>${attribute}: ${link[attribute]}</p>`;
              })
              .join('');
          })
          .join('')
      : '';
    this.$tooltip
      .html(
        `<p style="font-weight:600">Edge Details</p> <p>id: ${link.id}</p> ${edgeFieldsValuePairStr}`,
      )
      .style('display', 'block');
  };

  handleMouseOut = () => {
    this.$tooltip.style('display', 'none');
  };

  handleResize = () => {
    const { clientWidth, clientHeight } = this.ref;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });
  };

  handleUndo = () => {
    const { actionData, vertexes, edges } = this.props;
    const data = actionData.pop() as any;
    if (data.type === 'ADD') {
      this.props.updateActionData(
        actionData,
        _.differenceBy(edges, data.edges, (e: IEdge) => e.uuid),
        _.differenceBy(vertexes, data.vertexes, (v: INode) => v.uuid),
      );
    } else {
      this.props.updateActionData(
        actionData,
        _.unionBy(edges, data.edges, (e: IEdge) => e.uuid),
        _.unionBy(vertexes, data.vertexes, (v: INode) => v.uuid),
      );
    }
  };

  handleShowTags = async () => {
    const { asyncGetTagsFields, tags } = this.props;
    await asyncGetTagsFields({
      tags,
    });
    this.settingHandler.show();
  };

  handleShowEdges = async () => {
    const { asyncGetEdgeTypesFields, edgeTypes } = this.props;
    const _edgeTypes = edgeTypes.map(i => ({
      Name: i,
    }));
    await asyncGetEdgeTypesFields({
      edgeTypes: _edgeTypes,
    });
    this.settingHandler.show();
  };

  handleSetting = (type: string) => {
    if (type === 'tags') {
      this.setState(
        {
          isTags: true,
        },
        this.handleShowTags,
      );
    } else {
      this.setState(
        {
          isTags: false,
        },
        this.handleShowEdges,
      );
    }
  };

  handleEdgesNameChange = showEdgeFields => {
    const { edges } = this.props;
    edges.forEach((edge: any) => {
      if (
        !showEdgeFields.includes(`${edge.type}.type`) &&
        showEdgeFields.includes(`${edge.type}._rank`)
      ) {
        showEdgeFields.splice(showEdgeFields.indexOf(`${edge.type}._rank`), 1);
      }
    });
    this.setState({
      showEdgeFields,
    });
  };

  handleTgasNameChange = showTagFields => {
    this.setState({
      showTagFields,
    });
  };

  render() {
    const {
      vertexes,
      edges,
      actionData,
      tagsFields,
      tags,
      edgeTypes,
      edgesFields,
    } = this.props;
    const { width, height, showTagFields, showEdgeFields, isTags } = this.state;
    return (
      <div
        className="graph-wrap"
        ref={(ref: HTMLDivElement) => (this.ref = ref)}
      >
        {/* // TODO: move into <Panel/> */}
        <Button
          className="show-btn"
          onClick={() => this.handleSetting('tags')}
          disabled={tags.length === 0 || vertexes.length === 0}
        >
          {intl.get('explore.showTags')}
        </Button>
        <Button
          className="show-btn show-edges"
          onClick={() => this.handleSetting('edges')}
          disabled={edgeTypes.length === 0 || edges.length === 0}
        >
          {intl.get('explore.showEdges')}
        </Button>
        <Button
          className="history-undo"
          onClick={this.handleUndo}
          disabled={actionData.length === 0}
        >
          {intl.get('explore.undo')}
        </Button>
        <Panel />
        <NebulaD3
          width={width}
          height={height}
          showTagFields={showTagFields}
          showEdgeFields={showEdgeFields}
          data={{
            vertexes,
            edges,
          }}
          onMouseInLink={this.handleMouseInLink}
          onMouseInNode={this.handleMouseInNode}
          onMouseOut={this.handleMouseOut}
          onSelectVertexes={this.handleSelectVertexes}
          onDblClickNode={this.props.asyncBidirectExpand}
          onD3Ref={this.props.onD3Ref}
        />
        <Modal
          wrapClassName="graph-setting"
          handlerRef={handler => (this.settingHandler = handler)}
          footer={
            <Button
              key="confirm"
              type="primary"
              onClick={() => this.settingHandler.hide()}
            >
              {intl.get('explore.confirm')}
            </Button>
          }
        >
          <Setting
            showFields={isTags ? showTagFields : showEdgeFields}
            fields={isTags ? tagsFields : edgesFields}
            onNameChange={
              isTags ? this.handleTgasNameChange : this.handleEdgesNameChange
            }
          />
        </Modal>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(NebulaGraph);
