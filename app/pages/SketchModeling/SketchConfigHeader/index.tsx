import React from 'react';
import { message, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import domtoimage from 'dom-to-image';
import { trackEvent } from '@app/utils/stat';
import styles from './index.module.less';
import SketchTitleInput from './SketchTitleInput';
import ApplySpacePopover from './ApplySpacePopover';

const thumbnailMaxWidth = 195;
const thumbnailMaxHeight = 113;

const SketchConfigHeader: React.FC = () => {
  const { sketchModel } = useStore();
  const { editor, validateSchema, currentSketch, updateSketch, getSketchList } = sketchModel;
  const { intl } = useI18n();
  const filter = (node) => {
    if (node instanceof SVGElement) {
      const classname = typeof node.className === 'string' ? node.className : node.className.baseVal;
      return (
        !classname?.includes('activeNode') &&
        !classname?.includes('ve-link-points') &&
        !classname?.includes('ve-shdow-path')
      );
    }
    return true;
  };
  const handleSave = async () => {
    const data = sketchModel.editor.schema.getData();
    const isValid = await validateSchema();
    if (!isValid) {
      return;
    }
    const url = await domtoimage.toPng(document.getElementById('sketchContainer'), { bgcolor: 'transparent', filter });
    const img = new Image();
    img.src = url;
    img.onload = async () => {
      const baseUrl = compressBlob(img);
      window.URL.revokeObjectURL(url);
      const params = {
        name: currentSketch.name,
        schema: JSON.stringify(data),
        snapshot: baseUrl,
      };
      const code = await updateSketch(params);
      if (code === 0) {
        message.success(intl.get('sketch.saveSuccess'));
        await getSketchList();
      }
    };
  };

  const compressBlob = (img: HTMLImageElement) => {
    const { x, y, width, height } = editor.paper.getBoundingClientRect();
    let scaledWidth = thumbnailMaxWidth;
    let scaledHeight = (height / width) * scaledWidth;
    if(scaledHeight > thumbnailMaxHeight) {
      scaledWidth = (scaledWidth / scaledHeight) * thumbnailMaxHeight;
      scaledHeight = thumbnailMaxHeight;
    }
    const canvas = document.createElement('canvas');
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    const ctx = canvas.getContext('2d');
    const { x: cx, y: cy } = document.getElementById('sketchContainer').getBoundingClientRect();
    const offsetX = x - cx;
    const offsetY = y - cy;
    ctx.drawImage(img, offsetX, offsetY, width, height, 0, 0, scaledWidth, scaledHeight);
    return canvas.toDataURL('image/png');
  };

  const handleDownloadImg = async () => {
    trackEvent('sketch', 'download_sketch_img');
    const url = await domtoimage.toPng(document.getElementById('sketchContainer'), { bgcolor: '#F8F8F8' });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sketch.png';
    a.click();
  };

  const handleUpdateName = async (value: string) => {
    const code = await updateSketch({ name: value });
    if (code === 0) {
      message.success(intl.get('sketch.updateNameSuccess'));
    }
  };
  return (
    <div className={styles.header}>
      <SketchTitleInput value={currentSketch?.name} onChange={handleUpdateName} />
      {
        <div className={styles.actions}>
          <Tooltip title={intl.get('sketch.saveDraft')}>
            <Icon type="icon-workflow-save" onClick={handleSave} />
          </Tooltip>
          <Tooltip title={intl.get('sketch.export')}>
            <Icon className="btn-export" type="icon-console-export" onClick={handleDownloadImg} />
          </Tooltip>
          <ApplySpacePopover />
        </div>
      }
    </div>
  );
};

export default observer(SketchConfigHeader);
