import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import emptyPng from '@app/static/images/empty.png';
import { LanguageContext } from '@app/context';
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
  const { currentLocale } = useContext(LanguageContext);
  const prevLocale = useRef(currentLocale);
  useEffect(() => {
    trackPageView('/sketchModeling');
  }, []);
  const init = useCallback(async (data) => {
    await initEditor({ container: editorRef.current, schema: data });
    initTooltip({ container: editorRef.current });
  }, []);
  const updateData = useCallback(async () => {
    const { currentSketch, editor, destroy } = sketchModel;
    let data = currentSketch.schema;
    const existData = editor?.schema?.getData();
    if(existData) {
      destroy();
      data = JSON.stringify(existData);
    }
    init(data);
  }, []);
  useEffect(() => {
    currentSketch && updateData();
  }, [currentSketch?.id]);
  useEffect(() => {
    if(prevLocale.current !== currentLocale) {
      updateData(); 
      prevLocale.current = currentLocale;
    }
  }, [currentLocale]);
  return (
    <div className={styles.sketchModeling} key={currentLocale}>
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
