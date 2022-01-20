import * as d3 from 'd3';
import * as React from 'react';

import { INode, IPath } from '#app/utils/interface';

interface IProps {
  nodes: INode[];
  links: IPath[];
  selectedPaths: IPath[];
  offsetX: number;
  offsetY: number;
  scale: number;
  onSelectVertexes: (vertexes: INode[]) => void;
  onSelectEdges: (vertexes: IPath[]) => void;
}
/**
 * Test line and line acrosses
 *
 * @method isIntersectedLines
 * @param a1 - The start point of the first line
 * @param a2 - The end point of the first line
 * @param b1 - The start point of the second line
 * @param b2 - The end point of the second line
 */

function isIntersectedLines(a1, a2, b1, b2) {
  // b1->b2 向量 与 a1->b1向量的向量积
  const u1 = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
  // a1->a2向量 与 a1->b1向量的向量积
  const u2 = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
  // a1->a2向量 与 b1->b2向量的向量积
  const u3 = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
  // u3 == 0时，角度为0或者180 平行或者共线不属于相交
  if (u3 !== 0) {
    const ua = u1 / u3;
    const ub = u2 / u3;
    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      return true;
    }
  }
  return false;
}

export default class SelectIds extends React.Component<IProps, Record<string, unknown>> {
  componentDidMount() {
    const { nodes, links } = this.props;
    if (nodes.length !== 0 || links.length !== 0) {
      this.rectRender(nodes, links);
    }
  }

  componentDidUpdate() {
    const { nodes, links } = this.props;
    if (nodes.length !== 0 || links.length !== 0) {
      this.rectRender(nodes, links);
    }
  }

  rectRender(nodes: INode[], links: IPath[]) {
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
        // Prohibit right click trigger, conflict with right click menu
        if (d3.event.button === 2) {
          return;
        }

        selectStartPosition.x = d3.event.offsetX;
        selectStartPosition.y = d3.event.offsetY;
      })
      .on('mousemove', () => {
        if (selectStartPosition.x !== 0) {
          rect
            .attr('x', Math.min(d3.event.offsetX, selectStartPosition.x))
            .attr('y', Math.min(d3.event.offsetY, selectStartPosition.y))
            .attr('width', Math.abs(d3.event.offsetX - selectStartPosition.x))
            .attr('height', Math.abs(d3.event.offsetY - selectStartPosition.y));
        }
      })
      .on('mouseup', () => {
        // Prohibit right click trigger, conflict with right click menu
        if (d3.event.button === 2) {
          return;
        }
        const selectEndPosition = {
          x: d3.event.offsetX,
          y: d3.event.offsetY,
        };
        this.props.onSelectVertexes(
          nodes.filter(
            node =>
              !this.isNotSelected(node, selectStartPosition, selectEndPosition),
          ),
        );
        if (
          selectStartPosition.x !== selectEndPosition.x &&
          selectStartPosition.y !== selectEndPosition.y
        ) {
          const _edges = [] as IPath[];
          links.forEach((link: IPath) => {
            if (
              !this.isNotSelected(
                link.source,
                selectStartPosition,
                selectEndPosition,
              ) &&
              !this.isNotSelected(
                link.target,
                selectStartPosition,
                selectEndPosition,
              )
            ) {
              // startPoint and endPoint are in rect
              _edges.push(link);
            } else if (
              this.isLinkIntersectedWithRect(
                link.source,
                link.target,
                selectStartPosition,
                selectEndPosition,
              )
            ) {
              // no point in rect but line between two point is acrossed with rect
              _edges.push(link);
            }
          });
          this.props.onSelectEdges(_edges);
        } else if (d3.event.target.nodeName === 'svg') {
          // when click on canvas, clean the select result
          this.props.onSelectEdges([]);
        }
        selectStartPosition.x = 0;
        selectStartPosition.y = 0;
        rect.attr('width', 0).attr('height', 0);
      });
  }

  isNotSelected(nodePoint, selectStartPosition, selectEndPosition) {
    const { scale, offsetX, offsetY } = this.props;
    const x = nodePoint.x * scale + offsetX;
    const y = nodePoint.y * scale + offsetY;
    if (
      (x > selectStartPosition.x && x > selectEndPosition.x) ||
      (x < selectStartPosition.x && x < selectEndPosition.x) ||
      (y > selectStartPosition.y && y > selectEndPosition.y) ||
      (y < selectStartPosition.y && y < selectEndPosition.y)
    ) {
      return true;
    }
    return false;
  }

  isLinkIntersectedWithRect = (
    source,
    target,
    selectStartPosition,
    selectEndPosition,
  ) => {
    const { scale, offsetX, offsetY } = this.props;
    const startPoint = {
      x: source.x * scale + offsetX,
      y: source.y * scale + offsetY,
    };
    const endPoint = {
      x: target.x * scale + offsetX,
      y: target.y * scale + offsetY,
    };
    const r0 = {
      x: selectStartPosition.x,
      y: selectStartPosition.y,
    };
    const r1 = {
      x: selectStartPosition.x,
      y: selectEndPosition.y,
    };
    const r2 = {
      x: selectEndPosition.x,
      y: selectStartPosition.y,
    };
    const r3 = {
      x: selectEndPosition.x,
      y: selectEndPosition.y,
    };
    if (isIntersectedLines(startPoint, endPoint, r0, r1)) {
      return true;
    }
    if (isIntersectedLines(startPoint, endPoint, r1, r2)) {
      return true;
    }
    if (isIntersectedLines(startPoint, endPoint, r2, r3)) {
      return true;
    }
    if (isIntersectedLines(startPoint, endPoint, r3, r0)) {
      return true;
    }
    return false;
  };

  render() {
    return <rect className="rect" />;
  }
}
