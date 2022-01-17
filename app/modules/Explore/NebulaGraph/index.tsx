import * as d3 from 'd3';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { NebulaD3 } from '#app/components';
import DisplayPanel from '#app/components/DisplayPanel';
import ExpandComponent from '#app/components/Expand';
import { IDispatch, IRootState } from '#app/store';
import { convertBigNumberToString } from '#app/utils/function';
import { INode, IPath } from '#app/utils/interface';

import './index.less';
import Panel from './Panel';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
  selectVertexes: state.explore.selectVertexes,
  selectEdges: state.explore.selectEdges,
  showTagFields: state.explore.showTagFields,
  showEdgeFields: state.explore.showEdgeFields,
  space: state.nebula.currentSpace,
  edgesFields: state.nebula.edgesFields,
  canvasScale: state.d3Graph.canvasScale,
  canvasOffsetX: state.d3Graph.canvasOffsetX,
  canvasOffsetY: state.d3Graph.canvasOffsetY,
  spaceVidType: state.nebula.spaceVidType,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSelectIds: (vertexes: INode[]) => {
    dispatch.explore.update({
      selectVertexes: vertexes,
    });
  },
  updateSelectEdges: (edges: IPath[]) => {
    dispatch.explore.update({
      selectEdges: edges,
    });
  },
  asyncAutoExpand: dispatch.explore.asyncAutoExpand,
});

interface IState {
  width: number;
  height: number;
}

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}
class NebulaGraph extends React.Component<IProps, IState> {
  settingHandler;
  $tooltip;
  ref: HTMLDivElement;
  constructor(props: IProps) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
    };
  }

  handleSelectVertexes = (nodes: INode[]) => {
    this.props.updateSelectIds(nodes);
  };
  handleSelectEdges = (edges: IPath[]) => {
    this.props.updateSelectEdges(edges);
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
      .style('visibility', 'none')
      .style('opacity', '0.95');
    window.addEventListener('resize', this.handleResize);

    this.$tooltip.on('mouseout', this.handleMouseOut);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleMouseInNode = (node, event) => {
    this.renderVertexTips(node);
    this.renderTipPosition(event, 'node');
  };

  handleMouseInLink = (link, event) => {
    this.renderPathTips(link);
    this.renderTipPosition(event, 'link');
  };

  handleMouseOut = () => {
    this.$tooltip.style('visibility', 'hidden');
  };

  renderPathTips = link => {
    const properties = link.edgeProp ? link.edgeProp.properties : {};
    const edgeFieldsValuePairStr = Object.keys(properties)
      .map(property => {
        const value = properties[property];
        return `<div key=${property}><span>${
          link.type
        }.${property}: </span><span>${
          typeof value !== 'string'
            ? convertBigNumberToString(value)
            : JSON.stringify(value, (_, value) => {
                if (typeof value === 'string') {
                  return value.replace(/\u0000+$/, '');
                }
                return value;
              })
        }</span></div>`;
      })
      .join('');
    this.$tooltip.html(
      `<div>Edge Details</div><div><span>id: </span><span>${link.id}</span></div> ${edgeFieldsValuePairStr}`,
    );
  };

  renderVertexTips = node => {
    const properties = node.nodeProp ? node.nodeProp.properties : {};
    const vertexIDStr = `<div><span key='id'>vid: </span><span>${
      this.props.spaceVidType === 'INT64'
        ? node.name
        : JSON.stringify(
            // HACK: bigint to string, but json.stringify will show quotes
            node.name,
          )
    }</span></div>`;
    const nodeFieldsValuePairStr = Object.keys(properties)
      .map(property => {
        const valueObj = properties[property];
        return Object.keys(valueObj)
          .map(fields => {
            const value = valueObj[fields];
            return `<div key=${fields}><span>${property}.${fields}: </span><span>${
              typeof value !== 'string'
                ? convertBigNumberToString(value)
                : JSON.stringify(value, (_, value) => {
                    if (typeof value === 'string') {
                      return value.replace(/\u0000+$/, '');
                    }
                    return value;
                  })
            }</span></div>`;
          })
          .join('');
      })
      .join('');
    this.$tooltip.html(
      `<div>Vertex Details</div>${vertexIDStr} ${nodeFieldsValuePairStr}`,
    );
  };

  renderTipPosition = (event, type) => {
    const { width, height } = this.state;
    const { canvasScale, canvasOffsetY, canvasOffsetX } = this.props;
    const box = d3.select('.tooltip').node();
    if (box) {
      const {
        width: boxW,
        height: boxH,
      } = (box as HTMLElement).getBoundingClientRect();
      const target = d3.select(event.target);
      let left = event.offsetX * canvasScale;
      let top = event.offsetY * canvasScale;
      let offsetX = 10 * canvasScale;
      let offsetY = 10 * canvasScale;
      if (type === 'node') {
        left = Number(target.attr('cx')) * canvasScale + canvasOffsetX;
        top = Number(target.attr('cy')) * canvasScale + canvasOffsetY;
        offsetX = 20 * canvasScale;
        offsetY = 20 * canvasScale;
      } else if (type === 'link') {
        const positionArr = target.attr('d').split(' ');
        const sourceX = Number(positionArr[1]);
        const targetX = Number(positionArr[4]);
        const sourceY = Number(positionArr[2]);
        const targetY = Number(positionArr[5]);
        left = ((sourceX + targetX) / 2) * canvasScale + canvasOffsetX;
        top = ((sourceY + targetY) / 2) * canvasScale + canvasOffsetY;
        offsetX = 20 * canvasScale;
        offsetY = 20 * canvasScale;
      }
      if (width - left - offsetX < boxW) {
        left = left - boxW - offsetX;
      } else {
        left = left + offsetX;
      }
      if (height - top - offsetY < boxH) {
        top = top - boxH + offsetY;
      } else {
        top = top + offsetY;
      }
      this.$tooltip
        .style('top', top + 'px')
        .style('left', left + 'px')
        .style('visibility', 'initial');
    }
  };

  handleResize = () => {
    const { clientWidth, clientHeight } = this.ref;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });
  };

  render() {
    const {
      vertexes,
      edges,
      showTagFields,
      showEdgeFields,
      selectVertexes,
      selectEdges,
    } = this.props;
    const { width, height } = this.state;
    return (
      <div
        className="graph-wrap"
        ref={(ref: HTMLDivElement) => (this.ref = ref)}
      >
        <Panel toolTipRef={this.$tooltip} />
        <NebulaD3
          width={width}
          height={height}
          selectedNodes={selectVertexes}
          selectedPaths={selectEdges}
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
          onSelectEdges={this.handleSelectEdges}
          onDblClickNode={this.props.asyncAutoExpand}
        />
        <ExpandComponent />
        <DisplayPanel />
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(NebulaGraph);
