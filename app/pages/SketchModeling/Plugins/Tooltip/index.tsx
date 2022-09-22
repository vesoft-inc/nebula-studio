import ReactDOM from 'react-dom';
import rootStore from '@app/stores';

import intl from 'react-intl-universal';
import { onAbsolutePositionMove } from '@app/utils';
import { observer } from 'mobx-react-lite';
import { ISchemaEnum } from '@app/interfaces/schema';
import styles from './index.module.less';

// get WIDTH & MAX_HEIGHT from css
const OFFSET = 15;
const TOOLTIP_WIDTH = 280;
const TOOLTIP_MIN_HEIGHT = 63;
const TOOLTIP_MAX_HEIGHT = 300;
const Tooltip = observer(function Tooltip() {
  const { hoveringItem, tooltip, container } = rootStore.sketchModel;
  if (!hoveringItem) {
    return null;
  }
  const {
    data: { type, name, properties = [], fill, strokeColor },
  } = hoveringItem;
  const { left, top } = tooltip;
  const style = {} as any;
  const TOOLTIP_HEIGHT = Math.min(TOOLTIP_MIN_HEIGHT + properties.length * 30, TOOLTIP_MAX_HEIGHT);
  style.left =
    tooltip.left + OFFSET + TOOLTIP_WIDTH > container.clientWidth ? left - OFFSET - TOOLTIP_WIDTH : left + OFFSET;
  style.top =
    tooltip.top + OFFSET + TOOLTIP_HEIGHT > container.clientHeight ? top - OFFSET - TOOLTIP_HEIGHT : top + OFFSET;
  const renderLabel = () => {
    return type === ISchemaEnum.Tag ? (
      <span className={styles.tag} style={{ backgroundColor: fill as string, border: `3px solid ${strokeColor}` }}>
        {name}
      </span>
    ) : (
      <div className={styles.edgeType}>
        <span className={styles.line} />
        <span className={styles.edge}>{name}</span>
        <span className={styles.line} />
      </div>
    );
  };
  return (
    <div className={styles.sketchTooltip} style={style}>
      <h4>{intl.get('sketch.detail', { name: intl.get(`sketch.${type}`) })}</h4>
      {name && renderLabel()}
      {properties.map((item, index) => (
        <p key={index} className={styles.propertyItem}>
          {name}.{item.name} | {intl.get('sketch.type')}:{' '}
          {!item.type.startsWith('fixed_string') ? item.type : `${item.type}(${item.fixedLength})`}
        </p>
      ))}
    </div>
  );
});

export default Tooltip;

export function initTooltip({ container }: { container: HTMLElement }) {
  const { setTooltip } = rootStore.sketchModel;

  const dom = document.createElement('div');
  const disposer = onAbsolutePositionMove(container, setTooltip);

  ReactDOM.render(<Tooltip />, dom);
  container.appendChild(dom);

  return () => {
    disposer();
    container.removeChild(dom);
    ReactDOM.unmountComponentAtNode(container);
  };
}
