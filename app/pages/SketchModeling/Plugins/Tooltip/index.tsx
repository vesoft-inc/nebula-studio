import { createRoot } from 'react-dom/client';
import rootStore from '@app/stores';

import { useI18n } from '@vesoft-inc/i18n';
import { onAbsolutePositionMove } from '@app/utils';
import { observer } from 'mobx-react-lite';
import { ISchemaEnum } from '@app/interfaces/schema';
import { useEffect, useState } from 'react';
import styles from './index.module.less';

// get WIDTH & MAX_HEIGHT from css
const OFFSET = 10;
const TOOLTIP_WIDTH = 280;
const TOOLTIP_MIN_HEIGHT = 63;
const TOOLTIP_MAX_HEIGHT = 300;
const Tooltip = observer(function Tooltip() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const { intl } = useI18n();
  const [finalPos, setFinalPos] = useState({ left: 0, top: 0 });
  const { hoveringItem, tooltip, container } = rootStore.sketchModel;
  useEffect(() => {
    if (hoveringItem) {
      setData(hoveringItem);
      setTimeout(() => {
        setVisible(true);
      }, 200);
    } else {
      setTimeout(() => {
        setVisible(false);
      }, 200);
      data && setFinalPos({ left: tooltip.left, top: tooltip.top });
    }
  }, [hoveringItem]);
  if (!data) {
    return null;
  }

  const {
    data: { type, name, properties = [], fill, strokeColor },
  } = data;
  if (!container || (!name && !properties.length)) {
    return null;
  }
  const { left, top } = tooltip;
  const style = { left, top } as any;
  const TOOLTIP_HEIGHT = Math.min(TOOLTIP_MIN_HEIGHT + properties.length * 30, TOOLTIP_MAX_HEIGHT);
  const calculatePosition = (initialPosition) => {
    const { left, top } = initialPosition;
    style.left = left + OFFSET + TOOLTIP_WIDTH > container.clientWidth ? left - OFFSET - TOOLTIP_WIDTH : left + OFFSET;
    style.top = top + OFFSET + TOOLTIP_HEIGHT > container.clientHeight ? top - OFFSET - TOOLTIP_HEIGHT : top + OFFSET;
  };
  if (hoveringItem) {
    calculatePosition(tooltip);
  } else {
    calculatePosition(finalPos);
  }

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
    <div className={styles.sketchTooltip} style={{ ...style, display: visible ? 'block' : 'none' }}>
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
  const root = createRoot(dom);

  root.render(<Tooltip />);
  container.appendChild(dom);

  return () => {
    disposer();
    root.unmount();
    container.removeChild(dom);
  };
}
