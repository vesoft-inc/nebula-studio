import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import VEditor from '@vesoft-inc/veditor';
import { InstanceNode } from '@vesoft-inc/veditor/types/Shape/Node';
import initShapes from './Shapes/Shapers';
import { COLOR_LIST, NODE_RADIUS } from './Shapes/config';
import { NodeTypeListContainer, TagItem, CanvasContainer, TagListContainer, TagsContainer, shadowItem } from './styles';
import { useTheme } from '@emotion/react';
import { DraggingTag } from '@/interfaces';

function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<VEditor>();
  const [draggingNewTag, setDraggingNewTag] = useState<Partial<DraggingTag>>({});
  const [draggingPosition, setDraggingPosition] = useState({ x: 0, y: 0 });
  const theme = useTheme();

  useEffect(() => {
    if (containerRef.current === null) return;
    editorRef.current = new VEditor({
      dom: containerRef.current!,
    });
    initShapes(editorRef.current, theme);
    // initShadowFilter(editorRef.current);
    editorRef.current.graph.on('node:click', (node: InstanceNode) => {
      console.log('node:click', node);
    });
    editorRef.current.schema.setInitData({
      nodes: [
        {
          type: 'tag',
          uuid: 'node-1',
          x: 100,
          y: 100,
          name: 'node-1',
        },
        {
          type: 'tag',
          uuid: 'node-2',
          x: 300,
          y: 100,
          name: 'node-2',
        },
      ],
      lines: [
        {
          type: 'edge',
          uuid: 'edge-1',
          from: 'node-1',
          to: 'node-2',
          fromPoint: 0,
          toPoint: 0,
          graphIndex: -1,
        },
      ],
    });
    return () => {
      editorRef.current!.destroy();
    };
  }, []);

  const onDrag = (
    e: React.MouseEvent,
    item: {
      fill: string;
      strokeColor: string;
      shadow: string;
    }
  ) => {
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
      // @ts-ignore
      if (e.target?.tagName === 'svg') {
        const controller = editorRef.current!.controller;
        const rect = containerRef.current!.getBoundingClientRect();
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
    <CanvasContainer>
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
      {draggingNewTag.type && (
        <TagItem
          className={shadowItem}
          sx={{
            borderColor: draggingNewTag?.strokeColor,
            background: draggingNewTag?.fill,
            display: draggingNewTag ? 'block' : 'none',
            left: draggingPosition.x,
            top: draggingPosition.y,
          }}
        />
      )}
    </CanvasContainer>
  );
}

export default Canvas;
