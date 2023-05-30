import Icon from '@app/components/Icon';
import { COLOR_LIST } from '@app/config/sketch';
import { ISchemaEnum } from '@app/interfaces/schema';
import { useStore } from '@app/stores';
import { Tooltip } from 'antd';
import cls from 'classnames';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';

const TagBar: React.FC = () => {
  const { sketchModel } = useStore();
  const { intl } = useI18n();
  const { draggingNewTag, draggingPosition, addNode, active } = sketchModel;
  const onDrag = (e: React.MouseEvent, item) => {
    e.preventDefault();
    sketchModel.update({
      draggingNewTag: {
        ...item,
        type: ISchemaEnum.Tag,
        name: undefined,
        comment: undefined,
        properties: [],
        invalid: false,
      },
      draggingPosition: {
        x: e.nativeEvent.pageX - 25,
        y: e.nativeEvent.pageY - 25,
      },
    });
    addDragEvents();
  };

  const addDragEvents = useCallback(() => {
    const mousemove = (e: MouseEvent) => {
      if (sketchModel.draggingNewTag) {
        sketchModel.update({
          draggingPosition: { x: (e.pageX - 25) as number, y: e.pageY - 25 },
        });
      }
    };
    const mouseup = (e) => {
      if (e.target?.tagName === 'svg') {
        addNode(e);
      } else {
        sketchModel.update({
          draggingNewTag: undefined,
        });
      }
      window.document.removeEventListener('mousemove', mousemove);
      window.document.removeEventListener('mouseup', mouseup);
    };

    window.document.addEventListener('mousemove', mousemove);
    window.document.addEventListener('mouseup', mouseup);
    window.document.addEventListener('mouseleave', mouseup);
  }, []);
  return (
    <>
      <div className={cls(styles.tagBar, active && styles.offsetBar)}>
        <div className={styles.tags}>
          <span className={styles.tagLabel}>{intl.get('common.tag')}</span>
          <div className={styles.tagList}>
            {COLOR_LIST.map((item, index) => (
              <div
                key={index}
                style={{
                  borderColor: item.strokeColor,
                  backgroundColor: item.fill,
                  boxShadow: `0 1px 6px ${item.shadow}`,
                }}
                onMouseDown={(e) => onDrag(e, item)}
                className={styles.tagItem}
              />
            ))}
          </div>
          <Tooltip title={intl.get('sketch.dragTip')}>
            <Icon className={styles.tip} type="icon-studio-nav-help" />
          </Tooltip>
        </div>
      </div>
      <div
        className={cls(styles.tagItem, styles.shadowItem)}
        style={{
          borderColor: draggingNewTag?.strokeColor,
          background: draggingNewTag?.fill,
          display: draggingNewTag ? 'block' : 'none',
          left: draggingPosition.x,
          top: draggingPosition.y,
        }}
      />
    </>
  );
};
export default observer(TagBar);
