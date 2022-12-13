import { Button, message } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { isEqual, uniqWith } from 'lodash';
import { ISchemaEnum } from '@app/interfaces/schema';
import { v4 as uuidv4 } from 'uuid';

import { ARROW_STYLE, LINE_STYLE, NODE_RADIUS, COLOR_LIST, makeLineSort } from '@app/config/sketch';
import ZoomBtns from '@app/pages/SketchModeling/ZoomBtns';
import { initTooltip } from '@app/pages/SketchModeling/Plugins/Tooltip';
import { ISketchNode } from '@app/interfaces/sketch';
import styles from './index.module.less';

const NODE_CONFIG = {
  width: NODE_RADIUS * 2,
  height: NODE_RADIUS * 2,
  type: ISchemaEnum.Tag,
  hideActive: true,
  x: Math.random() * 100,
  y: Math.random() * 100,
};
const DANLEING_NODE_CONFIG = {
  strokeDasharray: '10 5',
  strokeColor: 'rgba(60, 60, 60, 0.5)',
  fill: 'transparent',
};
const SchemaVisualization = () => {
  const editorRef = useRef();
  const { intl } = useI18n();
  const { schema, sketchModel } = useStore();
  const { initEditor } = sketchModel;
  const { currentSpace, getSchemaSnapshot, getTagList, getEdgeList, getRandomEdgeData, getNodeTagMap, updateSchemaSnapshot } = schema;

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
      await getEdgeList();
      await getTagList();
      const { vids, edges, err } = await getRandomEdgeData();
      if(err) {
        message.warning(err);
        return;
      }
      if(vids.length === 0) {
        message.warning(intl.get('sketch.noData'));
        return;
      }
      const { tags, vidMap } = await getNodeTagMap(vids);
      const danglingEdges = [];
      const nodes = tags.map((tag, index) => {
        const color = COLOR_LIST[index % COLOR_LIST.length];
        return {
          ...NODE_CONFIG,
          name: tag,
          properties: schema.tagList.find(i => i.name === tag).fields.map(field => ({
            name: field.Field,
            type: field.Type,
          })),
          uuid: uuidv4(),
          strokeColor: color.strokeColor,
          fill: color.fill,
        } as Partial<ISketchNode>;
      });
      let lines = [];
      edges.forEach(line => {
        const { src, dst, name, properties } = line;
        const srcTags = vidMap[src];
        const dstTags = vidMap[dst];
        if(!srcTags || !dstTags) {
          danglingEdges.push(line);
        } else {
          srcTags?.forEach(srcTag => {
            dstTags?.forEach(dstTag => {
              lines.push({
                from: srcTag,
                to: dstTag,
                name,
                properties,
              });
            });
          });
        }
      });
      const result = danglingEdges.reduce((acc, cur) => {
        // {
        //   e1: {
        //     noSrc: [edge2, edge3],
        //     noDst: [],
        //     noBoth: edge1
        //   },
        //   ...,
        //   flatten: []
        // }
        const { src, dst, name } = cur;
        const uniqLines = acc.flatten;
        acc[name] = acc[name] || {};
        const lines = acc[name];
        const srcTags = vidMap[src];
        const dstTags = vidMap[dst];
        if(!srcTags && !dstTags) {
          if(!lines.noBoth) {
            lines.noBoth = cur;
            uniqLines.push({ ...cur, srcId: src, dstId: dst });
          }
        } else if (!srcTags) {
          dstTags.forEach(dstTag => {
            const hasDst = lines.noSrc?.find(i => i.dst === dstTag);
            const _line = { ...cur, dst: dstTag, srcId: src };
            if(!hasDst) {
              uniqLines.push(_line);
            }
            lines.noSrc ? lines.noSrc.push(_line) : lines.noSrc = [_line];
          });
        } else if (!dstTags) {
          srcTags.forEach(srcTag => {
            const hasDst = lines.noDst?.find(i => i.src === srcTag);
            const _line = { ...cur, src: srcTag, dstId: dst };
            if(!hasDst) {
              uniqLines.push(_line);
            }
            lines.noDst ? lines.noDst.push(_line) : lines.noDst = [_line];
          });
        }
        return acc;
      }, { flatten: [] });
      result.flatten.forEach(line => {
        const { src, dst, srcId, dstId, name, properties } = line;
        [srcId, dstId].forEach(vid => vid && nodes.every(i => i.vid !== vid) && nodes.push({
          ...NODE_CONFIG,
          ...DANLEING_NODE_CONFIG,
          vid,
          uuid: uuidv4(),
        } as Partial<ISketchNode>));
        lines.push({
          from: src,
          to: dst,
          name,
          properties,
        });
      });
      lines = uniqWith(lines, isEqual);
      const _lines = lines.map(line => {
        return {
          from: nodes.find(node => node.name === line.from || node.vid === line.from)?.uuid,
          to: nodes.find(node => node.name === line.to || node.vid === line.to)?.uuid,
          name: line.name,
          type: ISchemaEnum.Edge,
          fromPoint: 2,
          toPoint: 3,
          style: LINE_STYLE,
          arrowStyle: ARROW_STYLE,
          properties: line.properties,
          textBackground: '#fff'
        };
      }).filter(line => line.from && line.to);
      makeLineSort(_lines);
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
    initTooltip({ container: editorRef.current });
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
          <div className={styles.row}>
            <span className={styles.danglingEdges}>
              <span className={styles.dashedCircle} />
              <span className={styles.danglingLine} />
            </span>
            <span>{intl.get('common.danglingEdge')}</span>
          </div>
        </div>
        <ZoomBtns />
      </div>
      
    </div>
  );
};

export default observer(SchemaVisualization);
