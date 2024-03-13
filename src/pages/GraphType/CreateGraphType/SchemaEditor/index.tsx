import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';

import { COLOR_LIST, NODE_RADIUS } from '@/components/Shapes/config';
// import { VisualEditorNode } from '@/interfaces';
import { VisualEditorType } from '@/utils/constant';
import {
  NodeTypeListContainer,
  TagItem,
  CanvasContainer,
  TagListContainer,
  TagsContainer,
  shadowItem,
  ScaleBtnContainer,
} from './styles';
import ScaleBtns from '@/components/ScaleBtns';
import { useStore } from '@/stores';
import ConfigDrawer from './ConfigDrawer';
import { VEditorNode } from '@vesoft-inc/veditor/types/Model/Schema';
import { VisualNodeCustomizeInfo } from '@/interfaces';

function SchemaEditor() {
  const canvasContainer = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingTagRef = useRef<VisualNodeCustomizeInfo>({});
  const [draggingPosition, setDraggingPosition] = useState({ x: 0, y: 0 });
  const [showDragTag, setShowDragTag] = useState<boolean>(false);

  const { graphtypeStore } = useStore();
  const { schemaStore } = graphtypeStore;

  useEffect(() => {
    if (containerRef.current === null) return;
    schemaStore?.initEditor({
      container: containerRef.current,
      options: {
        mode: 'edit',
      },
    });
    return () => {
      schemaStore?.destroy();
    };
  }, [schemaStore]);

  const onDrag = (
    e: React.MouseEvent,
    item: {
      fill: string;
      strokeColor: string;
      shadow: string;
    }
  ) => {
    e.preventDefault();
    draggingTagRef.current = {
      ...item,
      type: VisualEditorType.Tag,
      properties: [],
      invalid: false,
    };
    setShowDragTag(true);
    setDraggingPosition({
      x: e.nativeEvent.pageX - 25,
      y: e.nativeEvent.pageY - 25,
    });
    addDragEvents();
  };

  const addDragEvents = () => {
    const mousemove = (e: MouseEvent) => {
      draggingTagRef.current && setDraggingPosition({ x: (e.pageX - 25) as number, y: e.pageY - 25 });
    };

    const mouseup = (e: MouseEvent) => {
      if (!schemaStore?.editor) return;
      if ((e.target as HTMLElement)?.tagName === 'svg') {
        const controller = schemaStore.editor.controller;
        const rect = containerRef.current!.getBoundingClientRect();
        if (e.clientX - rect.x < 0 || e.clientY - rect.y < 0) {
          draggingTagRef.current = {};
          return;
        }
        const x = (e.clientX - rect.x - controller.x) / controller.scale - 25 * controller.scale;
        const y = (e.clientY - rect.y - controller.y) / controller.scale - 25 * controller.scale;
        const node: VEditorNode = {
          x,
          y,
          width: NODE_RADIUS * 2,
          height: NODE_RADIUS * 2,
          type: VisualEditorType.Tag,
          ...draggingTagRef.current,
        };
        const addedNode = schemaStore.editor.graph.node.addNode(node);
        schemaStore?.setActiveItem(addedNode);
      }
      draggingTagRef.current = {};
      setShowDragTag(false);
      window.document.removeEventListener('mousemove', mousemove);
      window.document.removeEventListener('mouseup', mouseup);
    };

    window.document.addEventListener('mousemove', mousemove);
    window.document.addEventListener('mouseup', mouseup);
    window.document.addEventListener('mouseleave', mouseup);
  };

  const handleZoom = (type: 'in' | 'out') => () => {
    if (type === 'in') {
      schemaStore?.zoomIn();
    } else {
      schemaStore?.zoomOut();
    }
  };

  return (
    <CanvasContainer ref={canvasContainer}>
      <NodeTypeListContainer>
        <TagsContainer>
          <Typography sx={{ mb: 1.25 }}>Node Type</Typography>
          <TagListContainer>
            {COLOR_LIST.map((item, index) => (
              <TagItem
                key={index}
                style={{
                  borderColor: item.strokeColor,
                  backgroundColor: item.fill,
                  boxShadow: `0 1px 6px ${item.shadow}`,
                }}
                onMouseDown={(e) => onDrag(e, item)}
              />
            ))}
          </TagListContainer>
        </TagsContainer>
      </NodeTypeListContainer>
      <Box sx={{ width: '100%', height: '100%' }} ref={containerRef} />
      {showDragTag && draggingTagRef.current.type && (
        <TagItem
          className={shadowItem}
          sx={{
            borderColor: draggingTagRef.current.strokeColor,
            background: draggingTagRef.current.fill,
            display: draggingTagRef.current ? 'block' : 'none',
            left: draggingPosition.x,
            top: draggingPosition.y,
          }}
        />
      )}
      <ConfigDrawer />
      <ScaleBtnContainer active={Boolean(schemaStore?.activeItem)}>
        <ScaleBtns onZoomIn={handleZoom('in')} onZoomOut={handleZoom('out')} />
      </ScaleBtnContainer>
    </CanvasContainer>
  );
}

export default observer(SchemaEditor);
