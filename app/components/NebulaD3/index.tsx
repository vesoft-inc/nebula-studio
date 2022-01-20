import * as d3 from 'd3';
import * as React from 'react';
import { connect } from 'react-redux';

import SelectIds from './SelectIds';
import Labels from './NodeTexts';
import Links from './Links';
import IconCfg from '#app/components/IconPicker/iconCfg';
import Menu from '#app/modules/Explore/NebulaGraph/Menu';
import { IRootState } from '#app/store';
import { INode, IPath } from '#app/utils/interface';

import './index.less';

const mapState = (state: IRootState) => ({
  offsetX: state.d3Graph.canvasOffsetX,
  offsetY: state.d3Graph.canvasOffsetY,
  isZoom: state.d3Graph.isZoom,
  scale: state.d3Graph.canvasScale,
});
interface IProps extends ReturnType<typeof mapState> {
  width: number;
  height: number;
  data: {
    vertexes: INode[];
    edges: IPath[];
  };
  showTagFields: string[];
  showEdgeFields: string[];
  selectedNodes: INode[];
  selectedPaths: IPath[];
  onSelectVertexes: (vertexes: INode[]) => void;
  onSelectEdges: (edges: IPath[]) => void;
  onMouseInNode: (node: INode, event: MouseEvent) => void;
  onMouseOut: () => void;
  onMouseInLink: (link: IPath, event: MouseEvent) => void;
  onDblClickNode: () => void;
}

class NebulaD3 extends React.Component<IProps> {
  nodeRef: SVGGElement;
  circleRef: SVGCircleElement;
  canvasBoardRef: SVGCircleElement;
  force: any;
  svg: any;
  node: any;
  link: any;
  linksText: any;
  nodeText: any;
  iconText: any;

  componentDidMount() {
    this.svg = d3.select('#output-graph');
    const { offsetX, offsetY, scale } = this.props;
    this.initMarker();
    d3.select('.nebula-d3-canvas').attr(
      'transform',
      `translate(${offsetX},${offsetY}) scale(${scale})`,
    );
  }

  initMarker = () => {
    const defs = this.svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'marker')
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('viewBox', '-20 -10 20 20')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 20)
      .attr('markerHeight', 20)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M-10, -5 L 0,0 L -10, 5')
      .attr('fill', '#595959')
      .attr('stroke', '#595959');
    defs
      .append('marker')
      .attr('id', 'marker-actived')
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('viewBox', '-20 -10 20 20')
      .attr('refX', 25.5)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 16)
      .attr('markerHeight', 16)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M-16, -8 L 0,0 L -16, 8')
      .attr('fill', '#0091FF')
      .attr('stroke', '#0091FF')
      .attr('stroke-opacity', '0.6')
      .attr('fill-opacity', '0.9');
  };

  componentDidUpdate() {
    const { data, selectedNodes } = this.props;
    this.handleDeleteNodes(data.vertexes);
    this.handleUpdateNodes(data.vertexes, selectedNodes);
    this.handleUpdateIcons(data.vertexes);
    this.force.on('tick', () => this.tick());
  }

  handleNodeClick = (d: any) => {
    const event = d3.event;
    const { selectedNodes, onSelectVertexes } = this.props;
    if (event.shiftKey) {
      const data = selectedNodes.find(n => n.name === d.name)
        ? selectedNodes.filter(n => n.name !== d.name)
        : [...selectedNodes, d];
      onSelectVertexes(data);
    } else {
      onSelectVertexes([d]);
    }
  };

  handleEdgeClick = (d: any) => {
    const event = d3.event;
    const { selectedPaths, onSelectEdges } = this.props;
    if (event.shiftKey) {
      const data = selectedPaths.find(n => n.id === d.id)
        ? selectedPaths.filter(n => n.id !== d.id)
        : [...selectedPaths, d];
      onSelectEdges(data);
    } else {
      onSelectEdges([d]);
    }
  };

  dragged = d => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    d.isFixed = true;
  };

  dragstart = (d: any) => {
    if (!d3.event.active) {
      this.force.alphaTarget(0.6).restart();
    }
    return d;
  };

  dragEnded = () => {
    if (!d3.event.active) {
      this.force.alphaTarget(0);
    }
  };

  tick = () => {
    this.link.attr('d', (d: any) => {
      if (d.target.name === d.source.name) {
        const param = d.size > 1 ? 50 : 30;
        const dr = param / d.linknum;
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
    this.iconText?.attr('x', d => d.x).attr('y', d => d.y);

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
          return (
            this.edgeName(d)
              .join(' & ')
              .split('')
              .reverse()
              .join('') ||
            d.type
              .split('')
              .reverse()
              .join('')
          );
        }
        return this.edgeName(d).join(' & ') || d.type;
      });
    this.nodeRenderText();
  };

  handleDeleteNodes(nodes: INode[]) {
    const currentNodes = d3.selectAll('.node');
    if (nodes.length === 0) {
      currentNodes.remove();
      return;
    } else if (currentNodes.size() > nodes.length) {
      const ids = nodes.map(i => i.name);
      const deleteNodes = currentNodes.filter((data: any) => {
        return !ids.includes(data.name);
      });
      deleteNodes.remove();
      return;
    }
  }

  handleUpdateNodes(nodes: INode[], selectNodes: INode[]) {
    const selectNodeIds = selectNodes.map(node => node.uuid);
    d3.select(this.nodeRef)
      .selectAll('circle')
      .data(nodes)
      .style('fill', (d: INode) => d.color)
      .classed('active', (d: INode) => selectNodeIds.includes(d.uuid))
      .attr('id', (d: INode) => `circle-${d.uuid}`)
      .enter()
      .append<SVGGElement>('g')
      .attr('id', (d: INode) => `node_${d.uuid}`)
      .attr('class', 'node')
      .append<SVGCircleElement>('circle')
      .attr('class', 'circle')
      .attr('r', 20)
      .style('fill', (d: INode) => d.color) // HACK: Color distortion caused by delete node
      .on('mouseover', (d: INode) => {
        if (this.props.onMouseInNode) {
          this.props.onMouseInNode(d, d3.event);
        }
      })
      .on('mouseout', () => {
        if (this.props.onMouseOut) {
          this.props.onMouseOut();
        }
      });

    d3.select(this.nodeRef)
      .selectAll('g')
      .data(nodes)
      .classed('active-node', (d: INode) => selectNodeIds.includes(d.uuid));

    this.node = d3
      .selectAll('.circle')
      .on('click', this.handleNodeClick)
      .on('dblclick', this.props.onDblClickNode)
      .call(
        d3
          .drag()
          .on('start', d => this.dragstart(d))
          .on('drag', d => this.dragged(d))
          .on('end', this.dragEnded) as any,
      );
  }

  handleUpdateIcons = (nodes: INode[]) => {
    nodes.forEach(a => {
      if (
        a.icon &&
        !d3
          .select('#node_' + a.uuid)
          .select('.icon')
          .node()
      ) {
        d3.selectAll('#node_' + a.uuid)
          .append('text')
          .attr('class', 'icon')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('stroke', 'black')
          .attr('stroke-width', '0.00001%')
          .attr('font-family', 'nebula-cloud-icon')
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y)
          .attr('id', (d: any) => d.uuid)
          .attr('font-size', '20px')
          .text(IconCfg.filter(icon => icon.type === a.icon)[0].content);
      }
    });
    if (d3.selectAll('.icon').node()) {
      this.iconText = d3
        .selectAll('.icon')
        .on('click', this.handleNodeClick)
        .on('dblclick', this.props.onDblClickNode)
        .call(
          d3
            .drag()
            .on('start', d => this.dragstart(d))
            .on('drag', d => this.dragged(d))
            .on('end', this.dragEnded) as any,
        );
    }
  };

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
            .on('end', this.dragEnded) as any,
        );
    }
  };

  handleUpdateLinks = () => {
    if (this.force) {
      this.link = d3.selectAll('.link').on('click', this.handleEdgeClick);
      d3.selectAll('.link:not(.active-link):not(.hovered-link)')
        .attr('marker-end', 'url(#marker)')
        .style('stroke', '#595959')
        .style('stroke-width', 2);
      d3.selectAll('.link.active-link')
        .attr('marker-end', 'url(#marker-actived)')
        .style('stroke', '#0091ff')
        .style('stroke-width', 3);
      this.linksText = d3
        .selectAll('.text')
        .selectAll('.textPath')
        .attr(':href', (d: any) => '#text-path-' + d.uuid)
        .attr('startOffset', '50%');
    }
  };

  // compute to get (x,y ) of the nodes by d3-force: https://github.com/d3/d3-force/blob/v1.2.1/README.md#d3-force
  // it will change the data.edges and data.vertexes passed in
  computeDataByD3Force() {
    const { data } = this.props;
    const linkForce = d3
      .forceLink(data.edges)
      .id((d: any) => {
        return d.name;
      })
      .distance(210);
    if (!this.force) {
      this.force = d3
        .forceSimulation()
        .force('charge', d3.forceManyBody().strength(-20))
        .force(
          'collide',
          d3
            .forceCollide()
            .radius(35)
            .iterations(2),
        );
    }
    this.force
      .nodes(data.vertexes)
      .force('link', linkForce)
      .restart();
  }

  isIncludeField = (node, field) => {
    let isInclude = false;
    if (node.nodeProp && node.nodeProp.properties) {
      const properties = node.nodeProp.properties;
      isInclude = Object.keys(properties).some(v => {
        const valueObj = properties[v];
        return Object.keys(valueObj).some(
          nodeField => field === v + '.' + nodeField,
        );
      });
    }
    return isInclude;
  };

  edgeName = edge => {
    const { showEdgeFields } = this.props;
    const edgeText: any = [];
    if (showEdgeFields.includes(`${edge.type}.type`)) {
      if (showEdgeFields.includes(`${edge.type}._rank`)) {
        edgeText.push(`${edge.type}@${edge.rank}`);
      } else {
        edgeText.push(edge.type);
      }
    }

    showEdgeFields.forEach(field => {
      Object.keys(edge.edgeProp.properties).forEach(property => {
        if (field === `${edge.type}.${property}`) {
          edgeText.push(edge.edgeProp.properties[property]);
        }
      });
    });
    return edgeText;
  };

  targetName = (node, field) => {
    let nodeText = '';
    const properties = node.nodeProp.properties;
    Object.keys(properties).some(property => {
      const value = properties[property];
      return Object.keys(value).some(nodeField => {
        const fieldStr = property + '.' + nodeField;
        if (fieldStr === field) {
          nodeText = `${value[nodeField]}`;
          return true;
        }
      });
    });
    return nodeText;
  };

  nodeRenderText() {
    const { showTagFields, data } = this.props;
    d3.selectAll('tspan').remove();
    data.vertexes.forEach((node: any) => {
      let line = 1;
      if (node.nodeProp) {
        showTagFields.forEach(field => {
          if (this.isIncludeField(node, field)) {
            line++;
            d3.select('#name_' + node.uuid)
              .append('tspan')
              .attr('x', (d: any) => d.x)
              .attr('y', (d: any) => d.y - 20 + 20 * line)
              .attr('dy', '1em')
              .text(d => this.targetName(d, field));
          }
        });
      }
    });
  }

  iconRenderText() {
    const { data } = this.props;
    data.vertexes.forEach((node: any) => {
      if (node.nodeProp) {
        d3.select('#icon_' + node.uuid)
          .append('tspan')
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y)
          .attr('dy', '1em');
      }
    });
  }

  render() {
    this.computeDataByD3Force();
    const {
      width,
      height,
      data,
      onMouseInLink,
      onMouseOut,
      offsetX,
      offsetY,
      scale,
      selectedPaths,
      onSelectVertexes,
      onSelectEdges,
      isZoom,
    } = this.props;
    return (
      <>
        <svg
          id="output-graph"
          className={isZoom ? 'cursor-move' : undefined}
          width={width}
          height={height}
        >
          <g
            className="nebula-d3-canvas"
            ref={(ref: SVGCircleElement) => (this.canvasBoardRef = ref)}
          >
            <Links
              links={data.edges}
              selectedPaths={selectedPaths}
              onUpdateLinks={this.handleUpdateLinks}
              onMouseInLink={onMouseInLink}
              onMouseOut={onMouseOut}
            />
            <g
              className="nebula-d3-nodes"
              ref={(ref: SVGGElement) => (this.nodeRef = ref)}
            />
            <Labels
              nodes={data.vertexes}
              onUpDataNodeTexts={this.handleUpdataNodeTexts}
            />
          </g>
          <SelectIds
            nodes={data.vertexes}
            links={data.edges}
            offsetX={offsetX}
            offsetY={offsetY}
            scale={scale}
            onSelectVertexes={onSelectVertexes}
            onSelectEdges={onSelectEdges}
            selectedPaths={selectedPaths}
          />
        </svg>
        <Menu width={width} height={height} />
      </>
    );
  }
}

export default connect(mapState)(NebulaD3);
