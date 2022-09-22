import { Button, List, Modal, Tooltip } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import styles from './index.module.less';


interface IProps {
  onGqlSelect: (gql: string) => void;
}
const HistoryBtn = (props: IProps) => {
  const { onGqlSelect } = props;
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState([]);
  const handleView = () => {
    const data = getHistory();
    setData(data);
    setVisible(true);
  };

  const getHistory = () => {
    const value: string | null = localStorage.getItem('history');
    if (value && value !== 'undefined' && value !== 'null') {
      return JSON.parse(value).slice(0, 15);
    }
    return [];
  };

  const handleClear = () => {
    localStorage.removeItem('history');
    setVisible(false);
  };

  const handleSelect = (gql: string) => {
    onGqlSelect(gql);
    setVisible(false);
  };

  const renderStr = (str: string) => {
    if (str.length < 300) {
      return str;
    }
    return str.substring(0, 300) + '...';
  };

  return (
    <>
      <Tooltip
        title={intl.get('common.seeTheHistory')}
        placement="top"
      >
        <Icon
          className={styles.btnOperations}
          type="icon-studio-btn-history"
          onClick={handleView}
        />
      </Tooltip>
      <Modal
        title={
          <>
            <span>
              {intl.get('common.NGQLHistoryList')}
            </span>
            <Button type="link" onClick={handleClear}>
              {intl.get('console.deleteHistory')}
            </Button>
          </>
        }
        open={visible}
        className={styles.historyList}
        footer={null}
        onCancel={() => setVisible(false)}
      >
        {
          <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={(item: string) => (
              <List.Item
                style={{ cursor: 'pointer', wordBreak: 'break-all' }}
                onClick={() => handleSelect(item)}
              >
                {renderStr(item)}
              </List.Item>
            )}
          />
        }
      </Modal>
    </>
  );
};
export default HistoryBtn;
