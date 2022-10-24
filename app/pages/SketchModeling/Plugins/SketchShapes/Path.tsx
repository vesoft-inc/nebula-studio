/**
 * graph.line.shapes
 *
 * @interface DefaultLine
 */
import ReactDOM from 'react-dom';
import { ISketchEdge } from '@app/interfaces/sketch';
import { LineRender } from '@vesoft-inc/veditor/types/Shape/Lines/Line';
import { DefaultLine } from '@vesoft-inc/veditor';
import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
import { ISchemaEnum } from '@app/interfaces/schema';
import { getLinkCurvature, NODE_RADIUS } from '@app/config/sketch';
import { Bezier } from 'bezier-js';
import { InstanceNodePoint } from '@vesoft-inc/veditor/types/Shape/Node';
import { mat2d } from 'gl-matrix';
import styles from './index.module.less';

// get Angle for point in svg coordinate system 
const getPointAngle = (pointNode: InstanceNodePoint, graph): number => {
  const node = graph.node.nodes[pointNode.nodeId];
  const p = [pointNode.data.x, pointNode.data.y];
  let c = [0.5, 0.5];
  if (pointNode.data.isPixel) {
    c = [node.shapeBBox.width / 2, node.shapeBBox.height / 2];
  }
  const a = [p[0] - c[0], p[1] - c[1]];
  let angle = Math.atan(a[1] / a[0]) + (a[0] < 0 ? Math.PI : 0);
  angle %= Math.PI * 2;

  if (angle > -Math.PI / 4 && angle < Math.PI / 4) {
    return 0;
  } else if (angle > Math.PI / 4 && angle < Math.PI * 3 / 4) {
    return Math.PI / 2;
  } else if (angle > Math.PI * 5 / 4 && angle < Math.PI * 7 / 4 || (angle < -Math.PI / 4)) {
    return -Math.PI / 2;
  } else {
    return Math.PI;
  }
};
const getSelfLoopLineIndex = (line: InstanceLine, graph) => {
  const { from, to } = line;
  let index = 0;
  for (const lineId in graph.line.lines) {
    const each = graph.line.lines[lineId].data;
    if (each.from === each.to && each.from === from.nodeId && each.fromPoint === from.index && each.toPoint === to.index) {
      if (lineId === line.data.uuid) {
        break;
      }
      index++;
    }
  }
  return index;
};

const Path: LineRender = {
  type: ISchemaEnum.Edge,
  arcRatio: 4,
  ...DefaultLine,

  makePath(
    from,
    to,
    line
  ) {
    const fromNode = this.graph.node.nodes[from.nodeId];
    const src = {
      x: fromNode.data.x + NODE_RADIUS, 
      y: fromNode.data.y + NODE_RADIUS
    };
    const toNode = this.graph.node.nodes[to.nodeId];
    const dst = {
      x: toNode.data.x + NODE_RADIUS,
      y: toNode.data.y + NODE_RADIUS
    };
    const curvature = getLinkCurvature(line);
    const l = Math.sqrt(Math.pow(dst.x - src.x, 2) + Math.pow(dst.y - src.y, 2));
    let startControlPoint;
    let endControlPoint;
    let path;
    if(l > 0) {
      const a = Math.atan2(dst.y - src.y, dst.x - src.x);
      const d = l * curvature;
      const cp = {
        x: (src.x + dst.x) / 2 + d * Math.cos(a - Math.PI / 2),
        y: (src.y + dst.y) / 2 + d * Math.sin(a - Math.PI / 2),
      };
      startControlPoint = {
        x: cp.x + (src.x - cp.x) * 0.3,
        y: cp.y + (src.y - cp.y) * 0.3,
      };
      endControlPoint = {
        x: cp.x + (dst.x - cp.x) * 0.3,
        y: cp.y + (dst.y - cp.y) * 0.3,
      };
      const bzLine = new Bezier(src.x, src.y, startControlPoint.x, startControlPoint.y, endControlPoint.x, endControlPoint.y, dst.x, dst.y);
      const lineLen = bzLine
        ? bzLine.length()
        : Math.sqrt(Math.pow(dst.x - src.x, 2) + Math.pow(dst.y - src.y, 2));
      const getCoordsAlongLine = bzLine
        ? (t) => bzLine.get(t) 
        : (t) => ({
          x: src.x + (dst.x - src.x) * t || 0,
          y: src.y + (dst.y - src.y) * t || 0,
        });
      const startPos = getCoordsAlongLine((NODE_RADIUS + 8) / lineLen);
      const endPos = getCoordsAlongLine((lineLen - NODE_RADIUS - 8) / lineLen);
      const pathString = `M${startPos.x} ${startPos.y}`;
      const toPointString = `${endPos.x} ${endPos.y}`;
      path = `${pathString}C${startControlPoint.x} ${startControlPoint.y} ${endControlPoint.x} ${endControlPoint.y} ${toPointString}`;
      line.bezierData = {
        from: {
          x: src.x,
          y: src.y,
        },
        to: {
          x: dst.x,
          y: dst.y,
        },
        startControlPoint,
        endControlPoint
      };
    } else {
      const selfLoopRadius = 30;
      const startSpace = 8;
      const endSpace = 8;
      const start = { x: from.x, y: from.y };
      const end = { x: to.x, y: to.y };
      const startAngle = getPointAngle(from, this.graph);
      const endAngle = getPointAngle(to, this.graph);
      start.x += startSpace * Math.cos(startAngle);
      start.y += startSpace * Math.sin(startAngle);
      end.x += endSpace * Math.cos(endAngle);
      end.y += endSpace * Math.sin(endAngle);
      const selfLoopIndex = getSelfLoopLineIndex(line, this.graph);
      const angle = (from.index === to.index) ? 0 : (Math.PI / (selfLoopRadius / 10 + selfLoopIndex));
      const dis = Math.sqrt(Math.pow(from.x - to.x, 2) + Math.pow(from.y - to.y, 2));
      const radius = (dis / 2) / Math.sin(angle / 2);
      path = `M${from.x} ${from.y} A ${radius} ${radius} 0 1 0 ${end.x} ${end.y} L${to.x} ${to.y}`;
    }
    line.data.fromX = src.x;
    line.data.fromY = src.y;
    line.data.toX = dst.x;
    line.data.toY = dst.y;
    return path;
  },
  renderLabel(line: InstanceLine): SVGGElement {
    const { name, invalid } = line.data as ISketchEdge;
    if (!name) {
      if (line.label) {
        line.label.labelGroup.remove();
        line.label = null;
      }
      line.label = {
        text: null,
        textRect: null,
        labelGroup: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
      };
    } else if (!line.label) {
      line.label = {
        text: null,
        textRect: null,
        labelGroup: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
      };
    }
    // to append to last
    line.shape?.appendChild(line.label.labelGroup);

    let string = name;
    const showNum = 20;
    const totalLen = line.pathData.getTotalLength();
    const pointLen = line.pathData.getPointAtLength(totalLen / 2);
    // eslint-disable-next-line prefer-const
    let { x, y } = pointLen || {};
    if (name && name.length > showNum && showNum) {
      string = name.slice(0, showNum) + '...';
    }

    if(string || invalid) {
      const width = string ? Math.min(string?.length * 10 + 15, 100) : 15;
      ReactDOM.render(
        <>
          <foreignObject x={x - width / 2} y={y - 20} width={width} height={45} textAnchor="middle">
            <div className={styles.edgeLabel}>
              <span>
                {string}
                {invalid && <span className={styles.invalid} />}
              </span>
            </div>
          </foreignObject>
        </>,
        line.label.labelGroup
      );
    }
    return line.label.labelGroup;
  },
  renderArrow(line: InstanceLine): SVGElement {
    const { from, to } = line;
    let path;
    const svgEl = line.arrow ? line.arrow : window.document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    );
    const arrow = line.arrow ? line.arrow.children[0] : window.document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    const arrowShadow = line.arrow ? line.arrow.children[1] : window.document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    if(from.nodeId !== to.nodeId) {
      const fromNode = this.graph.node.nodes[from.nodeId];
      const src = {
        x: fromNode.data.x + NODE_RADIUS, 
        y: fromNode.data.y + NODE_RADIUS
      };
      const toNode = this.graph.node.nodes[to.nodeId];
      const dst = {
        x: toNode.data.x + NODE_RADIUS,
        y: toNode.data.y + NODE_RADIUS
      };
      const ARROW_WH_RATIO = 0.5;
      const ARROW_LENGTH = 6;
      const startR = NODE_RADIUS;
      const endR = NODE_RADIUS;

      const arrowRelPos = 1;
      const arrowHalfWidth = ARROW_LENGTH / ARROW_WH_RATIO / 2;
      const { from: bezierFrom, to: bezierTo, startControlPoint, endControlPoint } = line.bezierData || {};
      const bzLine = line.bezierData && new Bezier(bezierFrom.x, bezierFrom.y, startControlPoint.x, startControlPoint.y, endControlPoint.x, endControlPoint.y, bezierTo.x, bezierTo.y);
      const getCoordsAlongLine = bzLine
        ? (t) => bzLine.get(t) 
        : (t) => ({
          x: src.x + (dst.x - src.x) * t || 0,
          y: src.y + (dst.y - src.y) * t || 0,
        });

      const lineLen = bzLine
        ? bzLine.length()
        : Math.sqrt(Math.pow(dst.x - src.x, 2) + Math.pow(dst.y - src.y, 2));

      const posAlongLine = startR + ARROW_LENGTH + (lineLen - startR - endR - ARROW_LENGTH - 7) * arrowRelPos;
      const arrowHead = getCoordsAlongLine(posAlongLine / lineLen);
      const arrowTail = getCoordsAlongLine((posAlongLine - ARROW_LENGTH) / lineLen);

      const arrowTailAngle = Math.atan2(arrowHead.y - arrowTail.y, arrowHead.x - arrowTail.x) - Math.PI / 2;

      const cosVal = arrowHalfWidth * Math.cos(arrowTailAngle);
      const sinVal = arrowHalfWidth * Math.sin(arrowTailAngle);
      path = `M${arrowTail.x + cosVal} ${arrowTail.y + sinVal} L${arrowHead.x} ${arrowHead.y} L${arrowTail.x - cosVal} ${arrowTail.y - sinVal}`;
    } else {
      const angle = getPointAngle(to, this.graph);
      path = `M${10} ${5}L${0} ${0}L${10} ${-5}`;
      const matrix = mat2d.create();
      mat2d.translate(matrix, matrix, [to.x, to.y]);
      mat2d.rotate(matrix, matrix, angle);
      arrow.setAttribute('transform', `matrix(${matrix.join(',')})`);
      arrowShadow.setAttribute('transform', `matrix(${matrix.join(',')})`);
    }
    arrow.setAttribute('d', path);
    arrowShadow.setAttribute('d', path);
    if(!line.arrow) {
      arrow.setAttribute('class', styles.arrow);
      arrowShadow.setAttribute('class', styles.arrowShadow);
      svgEl.appendChild(arrow);
      svgEl.appendChild(arrowShadow);
    }
    return svgEl;
  },
  checkNewLine(data) {
    const { from, to, fromPoint, toPoint } = data;
    if (from === to && fromPoint === toPoint) {
      return false;
    }
    return true;
  },
};
export default Path;
