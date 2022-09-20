import React from 'react';
import { message, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import Icon from '@app/components/Icon';
import intl from 'react-intl-universal';
import { IProperty } from '@app/interfaces/sketch';
import domtoimage from 'dom-to-image';
import styles from './index.module.less';
import SketchTitleInput from './SketchTitleInput';
import ApplySpacePopover from './ApplySpacePopover';
const SketchConfigHeader: React.FC = () => {
  const { sketchModel } = useStore();
  const { editor, updateItem, active, currentSketch, updateSketch, getSketchList } = sketchModel;
  const validate = (data, type) => {
    const isInvalid = !data.name || (data.properties as IProperty[])?.some((i) => !i.name || !i.type);
    if (isInvalid) {
      updateItem(data as any, { invalid: true });
      if (type === 'node') {
        editor.graph.node.updateNode(editor.graph.node.nodes[data.uuid].data, true);
      } else {
        editor.graph.line.updateLine(editor.graph.line.lines[data.uuid].data, true);
      }
    }
    if (active?.uuid === data.uuid) {
      sketchModel.update({ active: { ...active, invalid: isInvalid } });
    }
    return !isInvalid;
  };

  const validateSchema = (data): boolean => {
    const { nodes, lines } = data;
    const nodesValid = nodes.reduce((flag, node) => validate(node, 'node') && flag, true);
    const edgesValid = lines.reduce((flag, line) => validate(line, 'edge') && flag, true);
    return nodesValid && edgesValid;
  };

  const filter = (node) => {
    if (node instanceof SVGElement) {
      const classname = typeof node.className === 'string' ? node.className : node.className.baseVal;
      return (
        node.tagName !== 'foreignObject' &&
        !classname?.includes('activeNode') &&
        !classname?.includes('ve-link-points') &&
        !classname?.includes('ve-shdow-path')
      );
    }
    return true;
  };
  const handleSave = async () => {
    const data = sketchModel.editor.schema.getData();
    const isValid = validateSchema(data);
    if (!isValid) {
      return message.warning(intl.get('sketch.sketchInvalid'));
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
    let scaledWidth;
    let scaledHeight;
    if (width > height) {
      scaledWidth = 195;
      scaledHeight = (height / width) * scaledWidth;
    } else {
      scaledHeight = 113;
      scaledWidth = (width / height) * scaledHeight;
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
    const url = await domtoimage.toPng(document.getElementById('sketchContainer'), { bgcolor: '#F8F8F8' });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sketch.png';
    a.click();
  };

  const handleUpdateName = (value: string) => {
    sketchModel.update({ currentSketch: { ...currentSketch, name: value } });
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
