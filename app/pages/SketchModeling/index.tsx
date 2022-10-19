import React, { useContext, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import emptyPng from '@app/static/images/empty.png';
import { ISketch } from '@app/interfaces/sketch';
import styles from './index.module.less';
import TagBar from './TagBar';
import ZoomBtns from './ZoomBtns';
import SketchConfigHeader from './SketchConfigHeader';
import SchemaConfig from './SchemaConfig';
import SketchList from './SketchList';

import { initTooltip } from './Plugins/Tooltip';
import { safeParse } from '@app/utils/function';
import { LanguageContext } from '@app/context';
const SketchPage: React.FC = (props) => {
  const { sketchModel } = useStore();
  const { initEditor, currentSketch } = sketchModel;
  const [item, setItem] = useState(null);
  const editorRef = useRef();
  const { currentLocale } = useContext(LanguageContext)
  useEffect(() => {
    trackPageView('/sketchModeling');
    return () => {
      const { currentSketch, editor } = sketchModel;
      if(currentSketch) {
        if(editor) {
          const data = editor.schema.getData();
          const _data = {
            ...currentSketch,
            schema: JSON.stringify(data),
          }
          sessionStorage.setItem('temporarySketch', JSON.stringify(_data))
        }
        sketchModel.destroy();
      }
    };
  }, []);
  useEffect(() => {
    if (currentSketch) {
      if(!item || item.id !== currentSketch.id) {
        initEditor({ container: editorRef.current, schema: currentSketch.schema });
        initTooltip({ container: editorRef.current });
      }
      setItem(currentSketch);
    } else {
      setItem(null);
    }
  }, [currentSketch]);
  useEffect(() => {
    if(sketchModel.currentSketch) {
      const temporarySketch: ISketch = safeParse(sessionStorage.getItem('temporarySketch'));
      if(temporarySketch && temporarySketch.id === sketchModel.currentSketch.id) {
        sketchModel.editor.schema.setInitData(JSON.parse(temporarySketch.schema));
        sessionStorage.removeItem('temporarySketch');
      }
    }
  }, [currentLocale])
  return (
    <div className={styles.sketchModeling}>
      <SketchList {...props} />
      {currentSketch ? (
        <div className={styles.sketchCanvas}>
          <SketchConfigHeader {...props} />
          <div id="sketchContainer" className={styles.content} ref={editorRef} />
          <TagBar {...props}  />
          <ZoomBtns {...props}  />
          <SchemaConfig {...props}  />
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
