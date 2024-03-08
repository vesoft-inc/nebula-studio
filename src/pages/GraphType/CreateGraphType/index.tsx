// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import VEditor from '@vesoft-inc/veditor';
import { InstanceNode } from '@vesoft-inc/veditor/types/Shape/Node';
import cls from 'classnames';
import styles from './index.module.less';
import initShapes, { initShadowFilter } from './Shapes/Shapers';
import { NODE_RADIUS, COLOR_LIST } from './config';

const SketchPage: React.FC = () => {
  const editorRef = useRef<VEditor>();
  const editorDOMRef = useRef<HTMLDivElement>(null);
  const { currentLocale } = useI18n();
  const [draggingNewTag, setDraggingNewTag] = useState<Record<string, unknown>>({});
  const [draggingPosition, setDraggingPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    editorRef.current = new VEditor({
      dom: editorDOMRef.current!,
      showBackGrid: false,
      disableCopy: true,
    });
    initShapes(editorRef.current);
    initShadowFilter(editorRef.current);
    editorRef.current.graph.on('node:click', (node: InstanceNode) => {
      console.log('node:click', node);
    });
    return () => {
      editorRef.current!.destroy();
    };
  }, []);

  const onDrag = (e: React.MouseEvent, item) => {
    e.preventDefault();
    setDraggingNewTag({
      ...item,
      type: 'tag',
      name: undefined,
      comment: undefined,
      properties: [],
      invalid: false,
    });
    setDraggingPosition({
      x: e.nativeEvent.pageX - 25,
      y: e.nativeEvent.pageY - 25,
    });
    addDragEvents();
  };

  const addDragEvents = useCallback(() => {
    const mousemove = (e: MouseEvent) => {
      if (draggingNewTag) {
        setDraggingPosition({ x: (e.pageX - 25) as number, y: e.pageY - 25 });
      }
    };
    const mouseup = (e: MouseEvent) => {
      if (e.target?.tagName === 'svg') {
        const controller = editorRef.current!.controller;
        const rect = editorDOMRef.current!.getBoundingClientRect();
        if (e.clientX - rect.x < 0 || e.clientY - rect.y < 0) {
          setDraggingNewTag({});
          return;
        }
        const x = (e.clientX - rect.x - controller.x) / controller.scale - 25 * controller.scale;
        const y = (e.clientY - rect.y - controller.y) / controller.scale - 25 * controller.scale;
        const node = {
          x,
          y,
          width: NODE_RADIUS * 2,
          height: NODE_RADIUS * 2,
          name: undefined,
          type: 'tag',
          ...draggingNewTag,
        };
        editorRef.current!.graph.node.addNode(node);
      }
      setDraggingNewTag({});

      window.document.removeEventListener('mousemove', mousemove);
      window.document.removeEventListener('mouseup', mouseup);
    };

    window.document.addEventListener('mousemove', mousemove);
    window.document.addEventListener('mouseup', mouseup);
    window.document.addEventListener('mouseleave', mouseup);
  }, []);

  return (
    <div className={styles.sketchModeling} key={currentLocale}>
      <div className={styles.sketchCanvas}>
        <div id="sketchContainer" className={styles.content} ref={editorDOMRef} />
        <div className={cls(styles.tagBar, draggingNewTag.uuid && styles.offsetBar)}>
          <div className={styles.tags}>
            <span className={styles.tagLabel}>Tag</span>
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
          </div>
        </div>
        {draggingNewTag.type && (
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
        )}
      </div>
    </div>
  );
};

export default SketchPage;
