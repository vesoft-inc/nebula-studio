import { useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useI18n } from '@vesoft-inc/i18n';
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
  const { currentLocale, intl } = useI18n();
  const preLocale = useRef(currentLocale);

  useEffect(() => {
    trackPageView('/sketchModeling');
    return () => {
      if (sketchModel.currentSketch) {
        sketchModel.currentSketch.schema = JSON.stringify(sketchModel.editor?.schema?.getData() || {});
        sketchModel.destroy();
      }
    };
  }, []);

  const init = useCallback((data) => {
    initEditor({ container: editorRef.current, schema: data });
    initTooltip({ container: editorRef.current });
  }, []);

  useEffect(() => {
    if (!currentSketch?.id) {
      return;
    }
    init(currentSketch.schema);
  }, [currentSketch?.id]);

  useEffect(() => {
    if (sketchModel.currentSketch && preLocale.current !== currentLocale) {
      const data = sketchModel.editor ? JSON.stringify(sketchModel.editor.schema.getData()) : null;
      init(data);
      preLocale.current = currentLocale;
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
        <div className={styles.empty}>
          <img src={emptyPng} alt="empty" />
          <div className={styles.emptyText}>{intl.get('sketch.noCurrentSketch')}</div>
          <div className={styles.emptyTips}>{intl.get('sketch.noCurrentSketchTips')}</div>
        </div>
      )}
    </div>
  );
};

export default observer(SketchPage);