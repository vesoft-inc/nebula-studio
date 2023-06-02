import { Button, List, Modal, Tooltip, Popconfirm } from 'antd';
import { useCallback, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';

import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';


interface IProps {
  onGqlSelect: (gql: string) => void;
}
const FavoriteBtn = (props: IProps) => {
  const { onGqlSelect } = props;
  const { console } = useStore();
  const [visible, setVisible] = useState(false);
  const { intl } = useI18n();
  const handleClear = useCallback(async () => {
    const { favorites, deleteFavorite, getFavoriteList } = console;
    if(!favorites.length) {
      return; 
    }
    await deleteFavorite();
    getFavoriteList();
  }, []);

  const handleSelect = useCallback((gql: string) => {
    onGqlSelect(gql);
    setVisible(false);
  }, []);

  const renderStr = useCallback((str: string) => {
    if (str.length < 300) {
      return str;
    }
    return str.substring(0, 300) + '...';
  }, []);

  return (
    <>
      <Tooltip title={intl.get('console.favorites')} placement="top">
        <Icon className={styles.btnOperations} type="icon-studio-btn-save" onClick={() => setVisible(true)} />
      </Tooltip>
      <Modal
        title={
          <>
            <span >
              {intl.get('console.favorites')}
            </span>
            <Popconfirm
              title={intl.get('sketch.confirmDelete')}
              okText={intl.get('common.confirm')}
              cancelText={intl.get('common.cancel')}
              onConfirm={handleClear}
            >
              <Button type="link">
                {intl.get('console.clearFavorites')}
              </Button>
            </Popconfirm>
          </>
        }
        open={visible}
        className={styles.favoriteList}
        footer={null}
        onCancel={() => setVisible(false)}
      >
        <List
          itemLayout="horizontal"
          dataSource={console.favorites}
          renderItem={(item: {
            id: string;
            content: string;
          }) => (
            <List.Item
              style={{ cursor: 'pointer', wordBreak: 'break-all' }}
              onClick={() => handleSelect(item.content)}
            >
              {renderStr(item.content)}
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};
export default observer(FavoriteBtn);
