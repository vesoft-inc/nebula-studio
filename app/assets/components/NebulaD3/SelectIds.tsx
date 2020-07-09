import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

interface IProps {
  nodes: INode[];
  offsetX: number;
  offsetY: number;
  scale: number;
  onSelectVertexes: (vertexes: any[]) => void;
}

export default class SelectIds extends React.Component<IProps, {}> {
  componentDidMount() {
    const { nodes } = this.props;
    if (nodes.length !== 0) {
      this.rectRender(nodes);
    }
  }

  componentDidUpdate() {
    const { nodes } = this.props;
    if (nodes.length !== 0) {
      this.rectRender(nodes);
    }
  }

  rectRender(nodes) {
    const { scale } = this.props;
    const selectStartPosition = {
      x: 0,
      y: 0,
    };
    const rect = d3
      .selectAll('.rect')
      .style('stroke', 'gray')
      .style('stroke-width', '0.6')
      .style('fill', 'transparent')
      .style('stroke-opacity', '0.6');

    d3.select('#output-graph')
      .on('mousedown', () => {
        selectStartPosition.x = d3.event.offsetX * (1 + scale);
        selectStartPosition.y = d3.event.offsetY * (1 + scale);
      })
      .on('mousemove', () => {
        if (selectStartPosition.x !== 0) {
          rect
            .attr(
              'x',
              Math.min(d3.event.offsetX * (1 + scale), selectStartPosition.x),
            )
            .attr(
              'y',
              Math.min(d3.event.offsetY * (1 + scale), selectStartPosition.y),
            )
            .attr(
              'width',
              Math.abs(d3.event.offsetX * (1 + scale) - selectStartPosition.x),
            )
            .attr(
              'height',
              Math.abs(d3.event.offsetY * (1 + scale) - selectStartPosition.y),
            );
        }
      })
      .on('mouseup', () => {
        this.props.onSelectVertexes(
          nodes.filter(node => !this.isNotSelected(node, selectStartPosition)),
        );
        selectStartPosition.x = 0;
        selectStartPosition.y = 0;
        rect.attr('width', 0).attr('height', 0);
      });
  }

  isNotSelected(nodePoint, selectStartPosition) {
    const { scale, offsetX, offsetY } = this.props;
    const x = nodePoint.x + offsetX;
    const y = nodePoint.y + offsetY;
    const selectEndPositionX = d3.event.offsetX * (1 + scale);
    const selectEndPositionY = d3.event.offsetY * (1 + scale);
    if (
      (x > selectStartPosition.x && x > selectEndPositionX) ||
      (x < selectStartPosition.x && x < selectEndPositionX) ||
      (y > selectStartPosition.y && y > selectEndPositionY) ||
      (y < selectStartPosition.y && y < selectEndPositionY)
    ) {
      return true;
    }
    return false;
  }

  render() {
    return <rect className="rect" />;
  }
}
