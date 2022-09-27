import { Button, message } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { isEqual, uniqWith } from 'lodash';
import { ISchemaEnum } from '@app/interfaces/schema';
import { v4 as uuidv4 } from 'uuid';

import { ARROW_STYLE, LINE_STYLE, NODE_RADIUS, COLOR_LIST } from '@app/config/sketch';
import ZoomBtns from '@app/pages/SketchModeling/ZoomBtns';
import styles from './index.module.less';

const SchemaVisualization = () => {
  const editorRef = useRef();
  const { schema, sketchModel } = useStore();
  const { initEditor } = sketchModel;
  const { currentSpace, getSchemaSnapshot, getSchemaInfo, getRandomEdgeData, getNodeTagMap, updateSchemaSnapshot } = schema;

  const [updateTime, setUpdateTime] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    trackPageView('/schema/visualization');
    initContainer();
    return () => {
      sketchModel.destroy();
    };
  }, []);
  useEffect(() => {
    setUpdateTime('');
    sketchModel.editor?.graph.clearGraph();
    getSnapshot();
  }, [currentSpace]);
  const handleGetVisulization = useCallback(async () => {
    setLoading(true);
    try {
      await getSchemaInfo();
      const { vids, edges } = await getRandomEdgeData();
      if(vids.length === 0) {
        message.warning(intl.get('sketch.noData'));
        return;
      }
      const { tags, vidMap } = await getNodeTagMap(vids);
      const nodes = tags.map((tag, index) => {
        const color = COLOR_LIST[index % COLOR_LIST.length];
        return {
          name: tag,
          uuid: uuidv4(),
          width: NODE_RADIUS * 2,
          height: NODE_RADIUS * 2,
          type: ISchemaEnum.Tag,
          strokeColor: color.strokeColor,
          fill: color.fill,
          hideActive: true,
          x: Math.random() * 100,
          y: Math.random() * 100,
        };
      });
      let lines = [];
      edges.forEach(line => {
        const { src, dst, name } = line;
        const srcTag = vidMap[src];
        const dstTag = vidMap[dst];
        lines.push({
          from: srcTag,
          to: dstTag,
          name
        });
      });
      lines = uniqWith(lines, isEqual);
      const _lines = lines.map(line => {
        return {
          from: nodes.find(node => node.name === line.from)?.uuid,
          to: nodes.find(node => node.name === line.to)?.uuid,
          name: line.name,
          type: ISchemaEnum.Edge,
          fromPoint: 2,
          toPoint: 3,
          style: LINE_STYLE,
          arrowStyle: ARROW_STYLE,
        };
      }).filter(line => line.from && line.to);

      await sketchModel.editor.schema.setData({ nodes, lines: _lines });
      await sketchModel.editor.schema.format();
      await sketchModel.editor.controller.autoFit();
      updateSnapshot();
      setUpdateTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    } finally {
      setLoading(false);
    }
    
  }, []);
  const updateSnapshot = useCallback(async () => {
    const data = sketchModel.editor.schema.getData();
    await updateSchemaSnapshot({
      space: schema.currentSpace,
      snapshot: JSON.stringify(data)
    });
  }, []);
  const initContainer = useCallback((schema?: string) => {
    initEditor({ 
      container: editorRef.current, 
      schema,
      options: { 
        mode: 'view',
        dagreOption: {
          nodesep: 150,
          rankdir: 'LR',
          ranksep: 150,
          align: 'UL',
        }
      } 
    });
  }, []);
  const getSnapshot = useCallback(async () => {
    setLoading(true);
    const { code, data } = await getSchemaSnapshot(schema.currentSpace);
    if (code === 0 && data) {
      const { snapshot, updateTime } = data;
      initContainer(snapshot);
      setUpdateTime(dayjs(updateTime).format('YYYY-MM-DD HH:mm:ss'));
    }
    setLoading(false);
  }, []);
  const showTime = updateTime && !loading;
  return (
    <div className={styles.schemaVisualization}>
      <div className={styles.operations}>
        <div>
          <Button
            type="primary"
            onClick={handleGetVisulization}
            loading={loading}
          >
            {intl.get(updateTime ? 'schema.refresh' : 'schema.getSchema')}
          </Button>
          {showTime && <>
            <span className={styles.label}>{intl.get('schema.lastRefreshTime')}</span>
            <span>
              {dayjs(updateTime).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </>}
        </div>
        <span className={styles.tip}>
          {intl.get('schema.getSchemaTip')}
        </span>
      </div>
      <div className={styles.container}>
        <div className={styles.visualizationContent} ref={editorRef} />
        <div className={styles.visualizationTip}>
          <div className={styles.row}>
            <span className={styles.circle} />
            <span>{intl.get('common.tag')}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.edge}>
              <span className={styles.line} />
              <span className={styles.arrow} />
            </span>
            <span>{intl.get('common.edge')}</span>
          </div>
        </div>
        <ZoomBtns />
      </div>
      
    </div>
  );
};

export default observer(SchemaVisualization);
