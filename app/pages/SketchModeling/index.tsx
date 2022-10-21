import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  const [item, setItem] = useState(null);
  const editorRef = useRef();
  const { currentLocale } = useContext(LanguageContext);
  useEffect(() => {
    trackPageView('/sketchModeling');
    return () => {
      sketchModel.currentSketch && sketchModel.destroy();
    };
  }, []);
  const init = useCallback((data) => {
    initEditor({ container: editorRef.current, schema: data });
    initTooltip({ container: editorRef.current });
  }, []);
  useEffect(() => {
    if (currentSketch) {
      if(!item || item.id !== currentSketch.id) {
        init(currentSketch.schema);
      }
      setItem(currentSketch);
    } else {
      setItem(null);
    }
  }, [currentSketch]);
  useEffect(() => {
    if(sketchModel.currentSketch) {
      const data = sketchModel.editor ? JSON.stringify(sketchModel.editor.schema.getData()) : null;
      init(data);
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
