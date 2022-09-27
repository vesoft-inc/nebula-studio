import { ISketchNode } from '@app/interfaces/sketch';
import VEditor, { DefaultNode } from '@vesoft-inc/veditor';
import { InstanceNode } from '@vesoft-inc/veditor/types/Shape/Node';
import ReactDOM from 'react-dom';
import { ISchemaEnum } from '@app/interfaces/schema';
import { NODE_RADIUS } from '@app/config/sketch';
import Path from './Path';
import styles from './index.module.less';
export default function initShapes(editor: VEditor) {
  const node = {
    ...DefaultNode.default,

    linkPoints: [
      { x: NODE_RADIUS - 1, y: 0, isPixel: true },
      { x: NODE_RADIUS - 1, y: 2 * (NODE_RADIUS - 1), isPixel: true },
      { x: 2 * (NODE_RADIUS - 1), y: NODE_RADIUS - 1, isPixel: true },
      { x: 0, y: NODE_RADIUS - 1, isPixel: true },
    ],
    render: (node: InstanceNode) => {
      const data = node.data as ISketchNode;
      // popOver
      node.shape = node.shape ? node.shape : document.createElementNS('http://www.w3.org/2000/svg', 'g');
      ReactDOM.render(
        <>
          {!data.hideActive && <circle className={styles.activeNode} r={NODE_RADIUS + 8} cx={NODE_RADIUS} cy={NODE_RADIUS} />}
          <circle
            className="svg-item"
            r={NODE_RADIUS - 1}
            cx={NODE_RADIUS}
            cy={NODE_RADIUS}
            strokeDasharray={data.strokeDasharray}
            style={{
              strokeWidth: 3,
              fill: data.fill,
              stroke: data.strokeColor,
            }}
          >
            <animate
              attributeName="r"
              from={24}
              to={NODE_RADIUS - 1}
              dur="0.2s"
              begin="DOMNodeInsertedIntoDocument"
              fill="freeze"
            />
          </circle>

          {data.name ? (
            <foreignObject x={0} y={0} width={NODE_RADIUS * 2} height={NODE_RADIUS * 2}>
              <div className={styles.labelContainer}>
                <span className={styles.label}>{data.name}</span>
              </div>
            </foreignObject>
          ) : null}
          {data.invalid && (
            <>
              <circle cx={NODE_RADIUS * 2 - 10} cy={10} r={12} fill="#EB5757" />
              <text
                style={{ userSelect: 'none' }}
                x={NODE_RADIUS * 2 - 10}
                y={10}
                textAnchor="middle"
                fontSize={16}
                fill="#fff"
                dy=".3em"
              >
                !
              </text>
            </>
          )}
        </>,
        node.shape
      );

      return node.shape;
    },
  };
  editor.graph.node.registeNode(ISchemaEnum.Tag, node);
  editor.graph.line.registeLine(ISchemaEnum.Edge, Path);
}

export const initShadowFilter = (svg: SVGElement) => {
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  ReactDOM.render(
    <>
      <filter id="whiteShadow">
        <feColorMatrix
          result="white-color"
          type="matrix"
          values="
        0 0 0 2000 0
        0 0 0 2000 0
        0 0 0 2000 0
        0 0 0 5 0"
        />
        <feGaussianBlur stdDeviation="2" in="white-color" result="offset-blur" />
        <feComposite operator="out" in="offset-blur" in2="white-color" result="inverse" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="whiteLineShadow">
        <feGaussianBlur stdDeviation="1" />
      </filter>
    </>,
    filter
  );
  svg.querySelector('defs').appendChild(filter);
};
