import { createRoot } from 'react-dom/client';
import { observer } from 'mobx-react-lite';
import { LinkObject, NodeObject } from '@vesoft-inc/force-graph';
import { onPointerMove } from '@app/utils';
import { convertBigNumberToString, removeNullCharacters } from '@app/utils/function';
import rootStore, { useStore } from '@app/stores';
import styles from './index.module.less';

function NodeTooltip({ node, style, show }: { node: NodeObject; style: React.CSSProperties; show: boolean }) {
  if (!show) {
    return null;
  }
  const { id = '', spaceVidType, properties = {}, tags = [], style: nodeStyle } = node || {};

  const propertyElement = Object.keys(properties).reduce((ret, property) => {
    const valueObj = properties[property];
    Object.keys(valueObj).forEach((fields) => {
      const fildValue = valueObj[fields]?.toString();
      const key = `${property}.${fields}`;
      ret.push(
        <div key={key}>
          <span>{`${key}: `}</span>
          <span>
            {typeof fildValue !== 'string'
              ? convertBigNumberToString(fildValue)
              : JSON.stringify(fildValue, (_, v) => (typeof v === 'string' ? removeNullCharacters(v) : v))}
          </span>
        </div>,
      );
    });
    return ret;
  }, [] as JSX.Element[]);

  return (
    <div className={styles.tooltip} style={style}>
      <h4>Vertex Details</h4>
      <span className={styles.tag} style={{ backgroundColor: (nodeStyle as any)?.fill || '#ff7875' }}>
        {(tags as string[])?.join(' | ')}
      </span>
      <div>
        <span>vid: </span>
        <span>{spaceVidType === 'INT64' ? id : JSON.stringify(id)}</span>
      </div>
      {propertyElement}
    </div>
  );
}

function LinkTooltipo({ link, style, show }: { link: LinkObject; style: React.CSSProperties; show: boolean }) {
  if (!show) {
    return null;
  }
  const { properties = {}, id } = link || {};
  const edgeType = link?.edgeType as string;
  if (!edgeType) {
    return null;
  }
  const propertyElement = Object.keys(properties).map((property) => (
    <div key={property?.toString()}>
      <span>{`${edgeType}.${property}: `}</span>
      <span>{properties[property]?.toString()}</span>
    </div>
  ));

  return (
    <div className={styles.tooltip} style={style}>
      <h4>Edge Details</h4>
      <div className={styles.edgeType}>
        <span className={styles.line} />
        <span className={styles.edge}>{edgeType}</span>
        <span className={styles.line} />
      </div>
      <div>
        <span>id: </span>
        <span>${id}</span>
      </div>
      {propertyElement}
    </div>
  );
}
let visible = '';
let style = {};
let hovering;
const Tooltip = observer(function Tooltip(props: { id: string }) {
  const {
    graphInstances: { graphs },
  } = useStore();
  if (!graphs[props.id]) {
    return null;
  }
  const { nodeHovering, linkHovering, pointer } = graphs[props.id];
  const { showContextMenu } = pointer;
  if ((nodeHovering || linkHovering) && !showContextMenu) {
    if (!visible) {
      style = { left: pointer.left, top: pointer.top };
      visible = nodeHovering ? 'node' : 'link';
    }
    hovering = nodeHovering || linkHovering;
  } else {
    setTimeout(() => {
      visible = '';
    }, 200);
  }
  return (
    <>
      <NodeTooltip
        show={visible === 'node'}
        node={hovering}
        style={{ ...style, display: visible === 'node' ? 'block' : 'none' }}
      />
      <LinkTooltipo
        show={visible === 'link'}
        link={hovering}
        style={{ ...style, display: visible === 'link' ? 'block' : 'none' }}
      />
    </>
  );
});

export default Tooltip;

export function initTooltip({ container, id }: { container: HTMLElement; id: string }) {
  const { graphs } = rootStore.graphInstances;
  const { setPointer } = graphs[id];

  const dom = document.createElement('div');
  const disposer = onPointerMove(container, setPointer);
  const root = createRoot(dom);

  root.render(<Tooltip id={id} />);
  container.appendChild(dom);

  return () => {
    disposer();
    root.unmount();
    container.removeChild(dom);
  };
}
