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
import Panel from './Pannel';
import Setting from './Setting';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
  selectVertexes: state.explore.selectVertexes,
  actionData: state.explore.actionData,
  space: state.nebula.currentSpace,
  tagsFields: state.nebula.tagsFields,
  tags: state.nebula.tags,
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
  asyncGetTagsName: dispatch.nebula.asyncGetTagsName,
});

interface IState {
  width: number;
  height: number;
  showFields: string[];
}

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

class NebulaGraph extends React.Component<IProps, IState> {
  settingHandler;
  $tooltip;
  ref: HTMLDivElement;

  constructor(props: IProps) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      showFields: [],
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
        showFields: [],
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleMouseInNode = node => {
    // const e: any = event || window.event;
    const nodeProp = node.nodeProp
      ? node.nodeProp.tables
          .map(v => {
            return Object.keys(v)
              .map(index => {
                return `<p key=${index}>${index}: ${v[index]}</p>`;
              })
              .join('');
          })
          .join('')
      : '';

    this.$tooltip
      .html(
        `<p style="font-weight:600">Vertex Details</p> <p>id: ${node.name}</p> ${nodeProp}`,
      )
      .style('display', 'block');
  };

  handleMouseInLink = link => {
    const linkText = Object.keys(link.edge)
      .filter(field => {
        return field !== 'id';
      })
      .map(key => {
        return `<p key=${key}>${key}: ${link.edge[key]}</p>`;
      })
      .join('');
    this.$tooltip
      .html(
        `<p style="font-weight:600">Edge Details</p> <p>id: ${link.id}</p> ${linkText}`,
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
        _.differenceBy(edges, data.edges, (e: IEdge) => e.id),
        _.differenceBy(vertexes, data.vertexes, (v: INode) => v.name),
      );
    } else {
      this.props.updateActionData(
        actionData,
        _.unionBy(edges, data.edges, (e: IEdge) => e.id),
        _.unionBy(vertexes, data.vertexes, (v: INode) => v.name),
      );
    }
  };

  handleSetting = async () => {
    const { asyncGetTagsName, tags } = this.props;
    await asyncGetTagsName({
      tags,
    });
    this.settingHandler.show();
  };

  handleTgasNameChange = showFields => {
    this.setState({
      showFields,
    });
  };

  render() {
    const {
      vertexes,
      edges,
      selectVertexes,
      actionData,
      tagsFields,
    } = this.props;
    const { width, height, showFields } = this.state;
    return (
      <div
        className="graph-wrap"
        ref={(ref: HTMLDivElement) => (this.ref = ref)}
      >
        <Button className="history-show" onClick={this.handleSetting}>
          {intl.get('explore.show')}
        </Button>
        {actionData.length !== 0 && (
          <Button className="history-undo" onClick={this.handleUndo}>
            {intl.get('explore.undo')}
          </Button>
        )}
        {selectVertexes.length !== 0 && <Panel />}
        <NebulaD3
          width={width}
          height={height}
          showFields={showFields}
          data={{
            vertexes,
            edges,
            selectIdsMap: selectVertexes.reduce((dict: any, vertex: INode) => {
              dict[vertex.name] = true;
              return dict;
            }, {}),
          }}
          onMouseInLink={this.handleMouseInLink}
          onMouseInNode={this.handleMouseInNode}
          onMouseOut={this.handleMouseOut}
          onSelectVertexes={this.handleSelectVertexes}
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
            showFields={showFields}
            tagsFields={tagsFields}
            onTgasNameChange={this.handleTgasNameChange}
          />
        </Modal>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(NebulaGraph);
