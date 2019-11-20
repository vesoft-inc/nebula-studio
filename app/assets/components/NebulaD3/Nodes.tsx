import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

interface IProps {
  nodes: INode[];
  selectIdsMap: Map<string, boolean>;
  onUpDataNodes: () => void;
  onMouseInNode: (node: any) => void;
  onMouseOutNode: () => void;
}

const colors = [
  '#1e78b4',
  '#b2df8a',
  '#fb9a99',
  '#e3181d',
  '#fdbf6f',
  '#ff7e01',
  '#cab2d6',
  '#6a3e9a',
  '#ffff99',
  '#b15828',
  '#7fc97f',
  '#beadd4',
  '#fdc086',
  '#ffff99',
  '#a6cee3',
  '#386cb0',
  '#f0007f',
  '#bf5a18',
];
const colorTotal = colors.length;

export default class Nodes extends React.Component<IProps, {}> {
  ref: SVGGElement;

  componentDidMount() {
    this.nodeRender(this.props.nodes);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.nodes.length !== 0 && this.props.nodes.length === 0) {
      d3.selectAll('.node').remove();
    } else {
      this.updateSelectNodes();
      this.nodeRender(this.props.nodes);
    }
  }

  updateSelectNodes = () => {
    const selectIdsMap = this.props.selectIdsMap;
    d3.select(this.ref)
      .selectAll('circle')
      .attr('class', (d: any) => {
        if (selectIdsMap[d.name]) {
          return 'node active';
        }
        return 'node';
      });
  };

  nodeRender(nodes: INode[]) {
    d3.select(this.ref)
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append<SVGCircleElement>('circle')
      .on('mouseover', (d: INode) => {
        if (this.props.onMouseInNode) {
          this.props.onMouseInNode(d);
        }
      })
      .on('mouseleave', () => {
        if (this.props.onMouseOutNode) {
          this.props.onMouseOutNode();
        }
      })
      .attr('class', 'node')
      .attr('id', (d: any) => `node-${d.name}`)
      .style('fill', (d: any) => colors[d.group % colorTotal]);
    if (this.ref) {
      this.props.onUpDataNodes();
    }
  }

  render() {
    return (
      <g ref={(ref: SVGCircleElement) => (this.ref = ref)} className="nodes" />
    );
  }
}
