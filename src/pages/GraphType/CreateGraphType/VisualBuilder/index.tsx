import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { observer } from 'mobx-react-lite';

import { CanvasContainer, ScaleBtnContainer, TagItem, shadowItem } from './styles';
import ScaleBtns from '@/components/ScaleBtns';
import { useStore } from '@/stores';
import ConfigDrawer from './ConfigDrawer';
import { INodeTypeItem, VisualInfo } from '@/interfaces';
import { ToolNodeColor } from '@/components/Shapes/config';
import { useTranslation } from 'react-i18next';
import { AddFilled } from '@vesoft-inc/icons';
import { VisualEditorType } from '@/utils/constant';

function VisualBuilder() {
  const canvasContainer = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { schemaStore } = useStore().graphtypeStore;
  const [showDragTag, setShowDragTag] = useState<boolean>(false);
  const [draggingPosition, setDraggingPosition] = useState({ x: 0, y: 0 });
  const { t } = useTranslation(['graphtype']);

  useEffect(() => {
    if (!schemaStore) return;
    if (containerRef.current === null) return;
    schemaStore?.initEditor({
      container: containerRef.current,
      options: {
        mode: 'edit',
      },
    });
    return () => {
      schemaStore?.destroyEditor();
    };
  }, [schemaStore]);

  const handleZoom = (type: 'in' | 'out') => () => {
    if (type === 'in') {
      schemaStore?.zoomIn();
    } else {
      schemaStore?.zoomOut();
    }
  };

  const addNodeType = (visualInfo: VisualInfo) => {
    if (!schemaStore?.editor) return;
    const nodeTypeItem = new INodeTypeItem();
    nodeTypeItem.style = visualInfo;
    schemaStore.clearActive();
    schemaStore.addNodeType(nodeTypeItem);
    schemaStore.setActiveItem({
      type: VisualEditorType.Tag,
      value: nodeTypeItem,
    });
  };

  const onDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDragTag(true);
    setDraggingPosition({
      x: e.nativeEvent.pageX - 25,
      y: e.nativeEvent.pageY - 25,
    });
    addDragEvents();
  };

  const addDragEvents = () => {
    const mousemove = (e: MouseEvent) => {
      setDraggingPosition({ x: (e.pageX - 25) as number, y: e.pageY - 25 });
    };

    const mouseup = (e: MouseEvent) => {
      if (!schemaStore?.editor) return;
      if ((e.target as HTMLElement)?.tagName === 'svg') {
        const controller = schemaStore.editor.controller;
        const rect = containerRef.current!.getBoundingClientRect();
        if (e.clientX - rect.x < 0 || e.clientY - rect.y < 0) {
          return;
        }
        const x = (e.clientX - rect.x - controller.x) / controller.scale - 25 * controller.scale;
        const y = (e.clientY - rect.y - controller.y) / controller.scale - 25 * controller.scale;
        addNodeType({ x, y });
      }
      setShowDragTag(false);
      window.document.removeEventListener('mousemove', mousemove);
      window.document.removeEventListener('mouseup', mouseup);
    };

    window.document.addEventListener('mousemove', mousemove);
    window.document.addEventListener('mouseup', mouseup);
    window.document.addEventListener('mouseleave', mouseup);
  };

  return (
    <CanvasContainer ref={canvasContainer}>
      <Box sx={{ width: '100%', height: '100%' }} ref={containerRef} />
      <TagItem
        sx={{
          borderColor: ToolNodeColor.strokeColor,
          backgroundColor: ToolNodeColor.fill,
          boxShadow: `0 1px 6px ${ToolNodeColor.shadow}`,
          position: 'absolute',
          top: 16,
          left: 16,
        }}
        onMouseDown={(e) => onDrag(e)}
      >
        <AddFilled /> {t('add', { ns: 'graphtype' })}
      </TagItem>
      <ConfigDrawer />
      <ScaleBtnContainer active={Boolean(schemaStore?.activeItem)}>
        <ScaleBtns onZoomIn={handleZoom('in')} onZoomOut={handleZoom('out')} />
      </ScaleBtnContainer>
      {showDragTag && (
        <TagItem
          className={shadowItem}
          sx={{
            borderColor: ToolNodeColor.strokeColor,
            background: ToolNodeColor.fill,
            left: draggingPosition.x,
            top: draggingPosition.y,
          }}
        />
      )}
    </CanvasContainer>
  );
}

export default observer(VisualBuilder);
