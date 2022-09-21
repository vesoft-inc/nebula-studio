import Icon from '@app/components/Icon';
import { Button, Input, Popconfirm, Modal, message } from 'antd';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import intl from 'react-intl-universal';
import cls from 'classnames';
import { useStore } from '@app/stores';
import { ISketch } from '@app/interfaces/sketch';
import { debounce } from 'lodash';
import styles from './index.module.less';

const { confirm } = Modal;

const SketchList: React.FC = () => {
  const { sketchModel } = useStore();
  const { sketchList, initSketch, deleteSketch, getSketchList, currentSketch, update, checkModified } = sketchModel;
  const handleAdd = useCallback(async () => {
    const id = await initSketch();
    if (id) {
      message.success(intl.get('schema.createSuccess'));
      const list = await getSketchList();
      if (!sketchModel.currentSketch) {
        update({ currentSketch: list.items[0] });
        return;
      }
      const isModified = checkModified();
      if(!isModified) {
        update({ currentSketch: list.items[0], active: null });
        return;
      }
    }
  }, []);
  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteSketch(id);
    if (result) {
      message.success(intl.get('common.deleteSuccess'));
      await getSketchList();
      sketchModel.currentSketch?.id === id && update({ currentSketch: null });
    }
  }, []);

  const handleSelect = useCallback((item: ISketch) => {
    if (!sketchModel.currentSketch) {
      update({ currentSketch: item });
      return;
    }
    const isModified = checkModified();
    if(!isModified) {
      update({ currentSketch: item, active: null });
      return;
    }
    confirm({
      title: intl.get('sketch.saveReminder'),
      okText: intl.get('common.confirm'),
      cancelText: intl.get('common.cancel'),
      onOk() {
        update({ currentSketch: item, active: null });
      },
      onCancel() {
        return;
      },
    });
  }, []);

  const debounceChange = useCallback(
    debounce((e) => getSketchList({ page: 1, keyword: e.target.value }), 300),
    []
  );
  useEffect(() => {
    getSketchList();
  }, []);
  return (
    <div className={styles.sketchList}>
      <div className={styles.header}>
        <span>{intl.get('sketch.list')}</span>
        <Button onClick={handleAdd} className={styles.addBtn} icon={<Icon type="icon-studio-btn-add" />} type="text">
          {intl.get('sketch.new')}
        </Button>
      </div>
      <Input
        allowClear
        className={styles.searchInput}
        onChange={debounceChange}
        suffix={<Icon type="icon-nav-filter" />}
      />
      <div className={styles.thumbnailList}>
        {sketchList.items.map((item) => (
          <div
            key={item.id}
            className={cls(styles.item, currentSketch?.id === item.id && styles.active)}
            onClick={() => handleSelect(item)}
          >
            <div className={styles.itemHeader}>
              <span className={styles.title}>{item.name}</span>
              <Popconfirm
                title={intl.get('sketch.confirmDelete')}
                okText={intl.get('common.confirm')}
                cancelText={intl.get('common.cancel')}
                onConfirm={() => handleDelete(item.id)}
              >
                <Icon className={styles.closeBtn} type="icon-studio-btn-close" />
              </Popconfirm>
            </div>
            <div className={styles.snapshot} style={{ background: `url(${item.snapshot}) center center no-repeat` }} />
          </div>
        ))}
      </div>
    </div>
  );
};
export default observer(SketchList);
