import Icon from '@app/components/Icon';
import { ISchemaEnum } from '@app/interfaces/schema';
// import { v1 as uuid } from 'uuid';
import { useStore } from '@app/stores';
import { Tooltip } from 'antd';
import cls from 'classnames';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import styles from './index.module.less';
const COLOR_LIST = [
  {
    fill: '#E6E6E6',
    strokeColor: 'rgba(60, 60, 60, 0.5)',
    shadow: 'rgba(90, 90, 90, 0.25)',
  },
  {
    fill: '#E4F1FF',
    strokeColor: 'rgba(34, 135, 227, 0.5)',
    shadow: 'rgba(0, 178, 255, 0.25)',
  },
  {
    fill: '#EBE4FF',
    strokeColor: 'rgba(84, 34, 227, 0.5)',
    shadow: 'rgba(20, 0, 255, 0.25)',
  },
  {
    fill: '#FEE4FF',
    strokeColor: 'rgba(227, 34, 196, 0.5)',
    shadow: 'rgba(255, 0, 229, 0.25)',
  },
  {
    fill: '#FFE4E4',
    strokeColor: 'rgba(227, 34, 34, 0.5)',
    shadow: 'rgba(255, 15, 0, 0.25)',
  },
  {
    fill: '#FFF9E4',
    strokeColor: 'rgba(218, 196, 0, 0.5)',
    shadow: 'rgba(209, 163, 0, 0.25)',
  },
  {
    fill: '#EFFFE4',
    strokeColor: 'rgba(54, 200, 2, 0.5)',
    shadow: 'rgba(0, 255, 10, 0.25)',
  },
  {
    fill: '#E4FFF4',
    strokeColor: 'rgba(0, 184, 162, 0.5)',
    shadow: 'rgba(0, 255, 194, 0.25)',
  },
];
const TagBar: React.FC = () => {
  const { sketchModel } = useStore();
  const { draggingNewTag, draggingPosition, addNode } = sketchModel;
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
      <div className={styles.tagBar}>
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
