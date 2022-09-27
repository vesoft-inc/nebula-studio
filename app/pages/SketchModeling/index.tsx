import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import emptyPng from '@app/static/images/empty.png';
import styles from './index.module.less';
import TagBar from './TagBar';
import ZoomBtns from './ZoomBtns';
import SketchConfigHeader from './SketchConfigHeader';
import SchemaConfig from './SchemaConfig';
import SketchList from './SketchList';

import { initTooltip } from './Plugins/Tooltip';
const SketchPage: React.FC = () => {
  const { sketchModel } = useStore();
  const { initEditor, currentSketch } = sketchModel;
  const editorRef = useRef();

  useEffect(() => {
    trackPageView('/sketchModeling');
    return () => {
      currentSketch && sketchModel.destroy();
    };
  }, []);
  useEffect(() => {
    if (currentSketch) {
      initEditor({ container: editorRef.current, schema: currentSketch.schema });
      initTooltip({ container: editorRef.current });
    }
  }, [currentSketch]);
  return (
    <div className={styles.sketchModeling}>
      <SketchList />
      {currentSketch ? (
        <div className={styles.sketchCanvas}>
          <SketchConfigHeader />
          <div id="sketchContainer" className={styles.content} ref={editorRef} />
          <TagBar />
          <ZoomBtns />
          <SchemaConfig />
        </div>
      ) : (
        <>
          <div className={styles.empty}>
            <img src={emptyPng} alt="empty" />
            <div className={styles.emptyText}>{intl.get('sketch.noCurrentSketch')}</div>
            <div className={styles.emptyTips}>{intl.get('sketch.noCurrentSketchTips')}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default observer(SketchPage);
