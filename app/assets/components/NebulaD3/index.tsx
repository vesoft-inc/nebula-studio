import { Slider } from 'antd';
import * as d3 from 'd3';
import * as React from 'react';

import './index.less';
import Links from './Links';
import Labels from './NodeTexts';
import SelectIds from './SelectIds';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

interface IProps {
  width: number;
  height: number;
  data: {
    vertexes: INode[];
    edges: any[];
    selectIdsMap: Map<string, boolean>;
  };
  showFields: string[];
  onSelectVertexes: (vertexes: INode[]) => void;
  onMouseInNode: (node: INode) => void;
  onMouseOut: () => void;
  onMouseInLink: (link: any) => void;
}

interface IRefs {
  mountPoint?: SVGSVGElement | null;
}

const whichColor = (() => {
  const colors = [
    '#66C5CC',
    '#F6CF71',
    '#F89C74',
    '#DCB0F2',
    '#87C55F',
    '#9EB9F3',
    '#FE88B1',
    '#C9DB74',
    '#8BE0A4',
    '#B497E7',
    '#D3B484',
    '#B3B3B3',
    '#5F4690',
    '#1D6996',
    '#38A6A5',
    '#0F8554',
    '#73AF48',
    '#EDAD08',
    '#E17C05',
    '#CC503E',
    '#94346E',
    '#6F4070',
    '#994E95',
    '#666666',
  ];
  const colorsTotal = colors.length;
  let colorIndex = 0;
  const colorsRecord = {};
  return key => {
    if (!colorsRecord[key]) {
      colorsRecord[key] = colors[colorIndex];
      colorIndex = (colorIndex + 1) % colorsTotal;
    }
    return colorsRecord[key];
  };
})();

class NebulaD3 extends React.Component<IProps, {}> {
  ctrls: IRefs = {};
  nodeRef: SVGCircleElement;
  circleRef: SVGCircleElement;
  force: any;
  svg: any;
  node: any;
  link: any;
  linksText: any;
  nodeText: any;
  selectedNodes: INode[] = [];
  state = {
    offsetX: 0,
    offsetY: 0,
    scale: 0,
    isMultiSelect: false,
  };

  handleShiftPress = event => {
    if (event.keyCode === 16) {
      this.setState({
        isMultiSelect: true,
      });
    }
  };

  handleShiftUp = event => {
    if (event.keyCode === 16) {
      this.setState({
        isMultiSelect: false,
      });
    }
  };

  componentDidMount() {
    if (!this.ctrls.mountPoint) {
      return;
    }
    this.svg = d3.select(this.ctrls.mountPoint);

    this.svg
      .append('defs')
      .append('marker')
      .attr('id', 'marker')
      .attr('viewBox', '-10 -10 20 20')
      .attr('refX', 21)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 12)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M-6.75,-6.75 L 0,0 L -6.75,6.75')
      .attr('fill', '#999')
      .attr('stroke', '#999');

    d3.select('.output-graph').on('click', () => {
      const tagName = d3.event.target.tagName;
      if (tagName !== 'text' && tagName !== 'circle') {
        // clear already select
        this.selectedNodes = [];
      }
    });
    window.addEventListener('keydown', this.handleShiftPress);
    window.addEventListener('keyup', this.handleShiftUp);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleShiftPress);
    window.removeEventListener('keyup', this.handleShiftUp);
  }

  handleNodeClick = (d: any) => {
    if (this.state.isMultiSelect) {
      if (this.selectedNodes.find(n => n.name === d.name)) {
        this.selectedNodes = this.selectedNodes.filter(n => n.name !== d.name);
      } else {
        this.selectedNodes = [...this.selectedNodes, d];
      }
      this.props.onSelectVertexes(this.selectedNodes);
    } else {
      this.selectedNodes = [];
      this.props.onSelectVertexes([d]);
    }
  };

  dragged = d => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  };

  dragstart = (d: any) => {
    if (!d3.event.active) {
      this.force.alphaTarget(0.6).restart();
    }
    d.fx = d.x;
    d.fy = d.y;

    return d;
  };

  dragEnded = d => {
    if (!d3.event.active) {
      this.force.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  };

  tick = () => {
    this.link.attr('d', (d: any) => {
      if (d.target.name === d.source.name) {
        const dr = 30 / d.linknum;
        return (
          'M' +
          d.source.x +
          ',' +
          d.source.y +
          'A' +
          dr +
          ',' +
          dr +
          ' 0 1,1 ' +
          d.target.x +
          ',' +
          (d.target.y + 1)
        );
      } else if (d.size % 2 !== 0 && d.linknum === 1) {
        return (
          'M ' +
          d.source.x +
          ' ' +
          d.source.y +
          ' L ' +
          d.target.x +
          ' ' +
          d.target.y
        );
      }
      const curve = 3;
      const homogeneous = 0.5;
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr =
        (Math.sqrt(dx * dx + dy * dy) * (d.linknum + homogeneous)) /
        (curve * homogeneous);
      if (d.linknum < 0) {
        const dr =
          (Math.sqrt(dx * dx + dy * dy) * (-1 * d.linknum + homogeneous)) /
          (curve * homogeneous);
        return (
          'M' +
          d.source.x +
          ',' +
          d.source.y +
          'A' +
          dr +
          ',' +
          dr +
          ' 0 0,0 ' +
          d.target.x +
          ',' +
          d.target.y
        );
      }
      return (
        'M' +
        d.source.x +
        ',' +
        d.source.y +
        'A' +
        dr +
        ',' +
        dr +
        ' 0 0, 1 ' +
        d.target.x +
        ',' +
        d.target.y
      );
    });

    this.node.attr('cx', d => d.x).attr('cy', d => d.y);

    this.nodeText
      .attr('x', (d: any) => {
        return d.x;
      })
      .attr('y', (d: any) => {
        return d.y + 35;
      });
    d3.selectAll('.text')
      .attr('transform-origin', (d: any) => {
        return `${(d.source.x + d.target.x) / 2} ${(d.source.y + d.target.y) /
          2}`;
      })
      .attr('rotate', (d: any) => {
        if (d.source.x - d.target.x > 0) {
          return 180;
        }
        return 0;
      });
    this.linksText
      .attr('x', (d: any) => {
        return (d.source.x + d.target.x) / 2;
      })
      .attr('y', (d: any) => {
        return (d.source.y + d.target.y) / 2;
      })
      .text((d: any) => {
        if (d.source.x - d.target.x > 0) {
          return d.type
            .split('')
            .reverse()
            .join('');
        }
        return d.type;
      });
    this.nodeRenderText();
  };

  handleUpdataNodes(nodes: INode[], selectIdsMap) {
    if (nodes.length === 0) {
      d3.selectAll('.node').remove();
      return;
    }
    d3.select(this.nodeRef)
      .selectAll('circle')
      .data(nodes)
      .attr('class', (d: INode) => {
        if (selectIdsMap[d.name]) {
          return 'node active';
        }
        return 'node';
      })
      .enter()
      .append<SVGCircleElement>('circle')
      .on('mouseover', (d: INode) => {
        if (this.props.onMouseInNode) {
          this.props.onMouseInNode(d);
        }
      })

      .on('mouseout', () => {
        if (this.props.onMouseOut) {
          this.props.onMouseOut();
        }
      })
      .attr('class', 'node')
      .attr('id', (d: INode) => `node-${d.name}`)
      .style('fill', (d: INode) => {
        const group = d.group;
        return whichColor(group);
      });

    d3.select(this.nodeRef)
      .selectAll('circle')
      .data(nodes)
      .exit()
      .remove();

    this.node = d3
      .selectAll('.node')
      .on('click', this.handleNodeClick)
      .call(
        d3
          .drag()
          .on('start', d => this.dragstart(d))
          .on('drag', d => this.dragged(d))
          .on('end', d => this.dragEnded(d)) as any,
      );
    this.force.on('tick', () => this.tick());
  }

  handleUpdataNodeTexts = () => {
    if (this.force) {
      this.nodeText = d3
        .selectAll('.label')
        .on('click', this.handleNodeClick)
        .on('mouseover', () => {
          if (this.props.onMouseOut) {
            this.props.onMouseOut();
          }
        })
        .call(
          d3
            .drag()
            .on('start', d => this.dragstart(d))
            .on('drag', d => this.dragged(d))
            .on('end', d => this.dragEnded(d)) as any,
        );
    }
  };

  handleUpdataLinks = () => {
    if (this.force) {
      this.link = d3.selectAll('.link').attr('marker-end', 'url(#marker)');
      this.linksText = d3
        .selectAll('.text')
        .selectAll('.textPath')
        .attr(':href', (d: any) => '#text-path-' + d.id)
        .attr('startOffset', '50%')
        .text((d: any) => {
          return d.type;
        });
    }
  };

  handleZoom = zoomSize => {
    const { width, height } = this.props;
    const scale = (100 - zoomSize) / 100;
    const offsetX = width * (scale / 2);
    const offsetY = height * (scale / 2);
    this.setState({
      scale,
      offsetX,
      offsetY,
    });
    d3.select(this.circleRef).attr(
      'transform',
      `translate(${offsetX} ${offsetY})`,
    );
  };

  // compute to get (x,y ) of the nodes by d3-force: https://github.com/d3/d3-force/blob/v1.2.1/README.md#d3-force
  // it will change the data.edges and data.vertexes passed in
  computeDataByD3Force() {
    const { width, height, data } = this.props;
    const linkForce = d3
      .forceLink(data.edges)
      .id((d: any) => {
        return d.name;
      })
      .distance((d: any) => {
        return d.value * 30;
      });
    if (!this.force) {
      this.force = d3
        .forceSimulation()
        .force('charge', d3.forceManyBody().strength(-20))
        .force(
          'collide',
          d3
            .forceCollide()
            .radius(60)
            .iterations(2),
        );
    }
    this.force
      .nodes(data.vertexes)
      .force('link', linkForce)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .restart();
    this.handleUpdataNodes(data.vertexes, data.selectIdsMap);
  }

  isIncludeField = (node, field) => {
    let isInclude = false;
    node.nodeProp.tables.forEach(v => {
      Object.keys(v).forEach(nodeField => {
        if (nodeField === field) {
          isInclude = true;
        }
      });
    });
    return isInclude;
  };

  targetName = (node, field) => {
    let nodeText = '';
    node.nodeProp.tables.forEach(v => {
      Object.keys(v).forEach(nodeField => {
        if (nodeField === field) {
          nodeText = `${nodeField}: ${v[nodeField]}`;
        }
      });
    });
    return nodeText;
  };

  nodeRenderText() {
    const { showFields, data } = this.props;
    d3.selectAll('tspan').remove();
    data.vertexes.forEach((node: any) => {
      let line = 1;
      if (node.nodeProp) {
        showFields.forEach(field => {
          if (this.isIncludeField(node, field)) {
            line++;
            d3.select('#name_' + node.name)
              .append('tspan')
              .attr('x', (d: any) => d.x)
              .attr('y', (d: any) => d.y + 20 * line)
              .attr('dy', '1em')
              .text(d => this.targetName(d, field));
          }
        });
      }
    });
  }
  render() {
    this.computeDataByD3Force();
    const { width, height, data, onMouseInLink, onMouseOut } = this.props;
    const { offsetX, offsetY, scale } = this.state;
    const marks = {
      0: {
        style: {
          fontSize: '20px',
        },
        label: <strong>-</strong>,
      },
      100: {
        style: {
          fontSize: '20px',
        },
        label: <strong>+</strong>,
      },
    };
    return (
      <div>
        <Slider
          defaultValue={100}
          className="slider"
          marks={marks}
          vertical={true}
          onAfterChange={this.handleZoom}
        />
        <svg
          className="output-graph"
          ref={mountPoint => (this.ctrls.mountPoint = mountPoint)}
          width={width}
          viewBox={`0 0 ${width * (1 + scale)}  ${height * (1 + scale)}`}
          height={height}
        >
          <g ref={(ref: SVGCircleElement) => (this.circleRef = ref)}>
            <Links
              links={data.edges}
              onUpdataLinks={this.handleUpdataLinks}
              onMouseInLink={onMouseInLink}
              onMouseOut={onMouseOut}
            />
            <g
              ref={(ref: SVGCircleElement) => (this.nodeRef = ref)}
              className="nodes"
            />
            <Labels
              nodes={data.vertexes}
              onUpDataNodeTexts={this.handleUpdataNodeTexts}
            />
          </g>
          <SelectIds
            nodes={data.vertexes}
            offsetX={offsetX}
            offsetY={offsetY}
            scale={scale}
            onSelectVertexes={this.props.onSelectVertexes}
          />
        </svg>
      </div>
    );
  }
}

export default NebulaD3;
