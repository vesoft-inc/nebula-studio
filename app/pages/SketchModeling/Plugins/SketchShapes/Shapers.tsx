import { ISketchNode, ISketchType } from '@app/interfaces/sketch';
import VEditor, { DefaultNode } from '@vesoft-inc/veditor';
import { InstanceNode } from '@vesoft-inc/veditor/types/Shape/Node';
import ReactDOM from 'react-dom';
import Path from './Path';
import styles from './index.module.less';
export default function initShapes(editor: VEditor) {
  const radius = 42;
  const node = {
    ...DefaultNode.default,

    linkPoints: [
      { x: radius - 1, y: 0, isPixel: true },
      { x: radius - 1, y: 2 * (radius - 1), isPixel: true },
      { x: 2 * (radius - 1), y: radius - 1, isPixel: true },
      { x: 0, y: radius - 1, isPixel: true },
    ],
    render: (node: InstanceNode) => {
      const data = node.data as ISketchNode;
      // popOver
      node.shape = node.shape ? node.shape : document.createElementNS('http://www.w3.org/2000/svg', 'g');
      ReactDOM.render(
        <>
          <circle className={styles.activeNode} r={radius + 8} cx={radius} cy={radius} />
          <circle
            className="svg-item"
            r={radius - 1}
            cx={radius}
            cy={radius}
            style={{
              strokeWidth: 3,
              fill: data.fill,
              stroke: data.strokeColor,
            }}
          >
            <animate
              attributeName="r"
              from={24}
              to={radius - 1}
              dur="0.2s"
              begin="DOMNodeInsertedIntoDocument"
              fill="freeze"
            />
          </circle>

          {data.name ? (
            <foreignObject x={0} y={0} width={radius * 2} height={radius * 2}>
              <div className={styles.labelContainer}>
                <span className={styles.label}>{data.name}</span>
              </div>
            </foreignObject>
          ) : null}
          {data.invalid && (
            <>
              <circle cx={radius * 2 - 10} cy={10} r={12} fill="#EB5757" />
              <text
                style={{ userSelect: 'none' }}
                x={radius * 2 - 10}
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
  editor.graph.node.registeNode(ISketchType.SketchNode, node);
  editor.graph.line.registeLine(ISketchType.SketchLine, Path);
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
