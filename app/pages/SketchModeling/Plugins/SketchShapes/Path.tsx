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
import styles from './index.module.less';
const Path: LineRender = {
  type: ISchemaEnum.Edge,
  arcRatio: 4,
  ...DefaultLine,
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
    ReactDOM.render(
      <>
        <foreignObject x={x - 50} y={y - 28} width={100} height={45} textAnchor="middle">
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
    return line.label.labelGroup;
  },
  checkNewLine() {
    return true;
  },
};
export default Path;
