import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

interface IProps {
  nodes: INode[];
  onSelectVertexes: (vertexes: any[]) => void;
}

export default class SelectIds extends React.Component<IProps, {}> {
  componentDidMount() {
    const { nodes } = this.props;
    if (nodes.length !== 0) {
      const startPoint = {
        x: 0,
        y: 0,
      };
      const rect = d3
        .selectAll('.rect')
        .style('stroke', 'gray')
        .style('stroke-width', '0.6')
        .style('fill', 'transparent')
        .style('stroke-opacity', '0.6');

      d3.selectAll('svg')
        .on('mousedown', () => {
          startPoint.x = d3.event.offsetX;
          startPoint.y = d3.event.offsetY;
        })
        .on('mousemove', () => {
          if (startPoint.x !== 0) {
            rect
              .attr('x', Math.min(d3.event.offsetX, startPoint.x))
              .attr('y', Math.min(d3.event.offsetY, startPoint.y))
              .attr('width', Math.abs(d3.event.offsetX - startPoint.x))
              .attr('height', Math.abs(d3.event.offsetY - startPoint.y));
          }
        })
        .on('mouseup', () => {
          this.props.onSelectVertexes(
            nodes.filter(node => !this.isNotSelected(node, startPoint)),
          );
          startPoint.x = 0;
          startPoint.y = 0;
          rect.attr('width', 0).attr('height', 0);
        });
    }
  }

  isNotSelected(nodePoint, startPoint) {
    if (
      (nodePoint.x > startPoint.x && nodePoint.x > d3.event.offsetX) ||
      (nodePoint.x < startPoint.x && nodePoint.x < d3.event.offsetX) ||
      (nodePoint.y > startPoint.y && nodePoint.y > d3.event.offsetY) ||
      (nodePoint.y < startPoint.y && nodePoint.y < d3.event.offsetY)
    ) {
      return true;
    }
    return false;
  }

  render() {
    return <rect className="rect" />;
  }
}
