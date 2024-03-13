import VEditor, { DefaultNode } from '@vesoft-inc/veditor';
import { InstanceNode } from '@vesoft-inc/veditor/types/Shape/Node';
import { Box, Theme } from '@mui/material';
import { createRoot } from 'react-dom/client';
import { NODE_RADIUS } from './config';
import { flushSync } from 'react-dom';
import Path from './Path';
import { ActiveNodeCicle, LabelContainer } from './styles';
export default function initShapes(editor: VEditor, theme: Theme) {
  const node = {
    ...DefaultNode.default,

    linkPoints: [
      { x: NODE_RADIUS - 1, y: 0, isPixel: true },
      { x: NODE_RADIUS - 1, y: 2 * (NODE_RADIUS - 1), isPixel: true },
      { x: 2 * (NODE_RADIUS - 1), y: NODE_RADIUS - 1, isPixel: true },
      { x: 0, y: NODE_RADIUS - 1, isPixel: true },
    ],

    render: (node: InstanceNode) => {
      const data = node.data;
      // popOver
      node.shape = node.shape ? node.shape : document.createElementNS('http://www.w3.org/2000/svg', 'g');
      // @ts-ignore
      const root = node.shape.__reactRoot || createRoot(node.shape);
      // @ts-ignore
      // keep the root, avoid `react createroot multiple times` warning
      node.shape.__reactRoot = root;
      flushSync(() => {
        root.render(
          <>
            {!data.hideActive && <ActiveNodeCicle r={NODE_RADIUS + 8} cx={NODE_RADIUS} cy={NODE_RADIUS} />}
            <circle
              className="svg-item"
              r={NODE_RADIUS - 1}
              cx={NODE_RADIUS}
              cy={NODE_RADIUS}
              strokeDasharray={data.strokeDasharray as string}
              style={{
                strokeWidth: 3,
                fill: data.fill as string,
                stroke: data.strokeColor as string,
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
                <LabelContainer>
                  <Box component="span">{data.name}</Box>
                </LabelContainer>
              </foreignObject>
            ) : null}
            {data.invalid && (
              <>
                <circle cx={NODE_RADIUS * 2 - 10} cy={10} r={12} fill={theme.palette.vesoft.status3} />
                <text
                  style={{ userSelect: 'none' }}
                  x={NODE_RADIUS * 2 - 10}
                  y={10}
                  textAnchor="middle"
                  fontSize={16}
                  fill={theme.palette.vesoft.bgColor}
                  dy=".3em"
                >
                  !
                </text>
              </>
            )}
          </>
        );
      });
      return node.shape;
    },
  };
  editor.graph.node.registeNode('tag', node);
  editor.graph.line.registeLine('edge', Path);
}

export const initShadowFilter = (editor: VEditor) => {
  const shadow = editor.graph.shadow?.querySelector('defs');
  if (!shadow) return;
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const root = createRoot(filter);
  root.render(
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
    </>
  );
  shadow.appendChild(filter);
};
