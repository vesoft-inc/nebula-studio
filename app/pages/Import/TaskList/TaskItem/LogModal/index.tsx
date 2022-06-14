import { Button, Modal, Tabs } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';
import { ITaskStatus } from '@app/interfaces/import';
import classnames from 'classnames';
import styles from './index.module.less';

const { TabPane } = Tabs;

interface ILogDimension {
  space: string;
  id: number;
  status: ITaskStatus;
}

interface IProps {
  logDimension: ILogDimension;
  visible: boolean;
  onCancel: () => void;
  showLogDownload: boolean
}

let isMounted = true;

const LogModal = (props: IProps) => {
  const { visible, onCancel, showLogDownload, logDimension: { space, id, status } } = props;
  const { dataImport: { getLogs, downloadTaskLog, getLogDetail } } = useStore();
  const logRef = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);
  const offset = useRef(0);
  const _status = useRef(status);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLog, setCurrentLog] = useState<string | null>(null);
  const handleTabChange = (key: string) => {
    setCurrentLog(logs.filter(item => item === key)[0]);
  };

  const getAllLogs = async () => {
    const { code, data } = await getLogs(id);
    if(code === 0) {
      const logs = data.names || [];
      setLogs(logs);
      setCurrentLog(logs[0]);
    }
  };

  const handleLogDownload = () => {
    if(currentLog) {
      downloadTaskLog({
        id,
        name: currentLog
      });
    }
  };

  const readLog = async () => {
    const data = await getLogDetail({
      offset: offset.current,
      id,
      limit: 500,
      file: currentLog
    });
    isMounted && handleLogData(data);
  };

  const handleLogData = (data) => {
    if(!logRef.current) {
      timer.current = setTimeout(readLog, 2000);
      return; 
    }
    if (data && data.length > 0) {
      logRef.current.innerHTML += data.join('<br/>') + '<br/>';
      logRef.current.scrollTop = logRef.current.scrollHeight;
      offset.current += data.length;
      if(isMounted) {
        timer.current = setTimeout(readLog, 2000);
      }
    } else if (_status.current === ITaskStatus.StatusProcessing) {
      if(isMounted) {
        timer.current = setTimeout(readLog, 2000);
      }
    } else {
      offset.current = 0;
    }
  };

  const initLog = async () => {
    setLoading(true);
    await readLog();
    setLoading(false);
  };
  useEffect(() => {
    isMounted = true;
    if(showLogDownload) {
      getAllLogs();
    } else {
      initLog();
    }
    return () => {
      isMounted = false;
      clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    _status.current = status;
  }, [status]);
  useEffect(() => {
    clearTimeout(timer.current);
    if(logRef.current) {
      logRef.current.innerHTML = '';
    }
    offset.current = 0;
    if(currentLog && isMounted) {
      readLog();
    }
  }, [currentLog]);
  return (
    <Modal
      title={<>
        <div className={styles.importModalTitle}>
          <span>{`${space} ${intl.get('import.task')} - ${intl.get('common.log')}`}</span>
          {(loading || status === ITaskStatus.StatusProcessing) && <Button type="text" loading={true} />}
        </div>
        {showLogDownload && <Button className="studioAddBtn primaryBtn" onClick={handleLogDownload}>
          <Icon type="icon-studio-btn-download" />
          {intl.get('import.downloadLog')}
        </Button>}
      </>}
      width="80%"
      visible={visible}
      onCancel={onCancel}
      wrapClassName={styles.logModal}
      destroyOnClose={true}
      footer={false}
    >
      {showLogDownload && <Tabs className={styles.logTab} tabBarGutter={0} tabPosition="left" onChange={handleTabChange}>
        {logs.map(log => (
          <TabPane tab={log} key={log} />
        ))}
      </Tabs>}
      <div className={classnames(styles.logContainer, !showLogDownload && styles.full)} ref={logRef}/>
    </Modal>
  );
};

export default LogModal;
