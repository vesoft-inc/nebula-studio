import { Button, Modal, Tabs } from 'antd';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';
import { ITaskStatus } from '@app/interfaces/import';
import styles from './index.module.less';

const { TabPane } = Tabs;

interface ILogDimension {
  space: string;
  id: number;
  status: ITaskStatus;
}

interface ILog {
  name: string;
}
interface IProps {
  logDimension: ILogDimension;
  visible: boolean;
  onCancel: () => void;
}
const LogModal = (props: IProps) => {
  const { visible, onCancel, logDimension: { space, id, status } } = props;
  const { dataImport: { getLogs, downloadTaskLog, getImportLogDetail, getErrLogDetail } } = useStore();
  const logRef = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);
  const offset = useRef(0);
  const _status = useRef(status);
  const [logs, setLogs] = useState<ILog[]>([]);
  const [currentLog, setCurrentLog] = useState<ILog | null>(null);
  const handleTabChange = (key: string) => {
    setCurrentLog(logs.filter(item => item.name === key)[0]);
  };

  const getAllLogs = async () => {
    const { code, data } = await getLogs(id);
    if(code === 0) {
      setLogs(data);
      setCurrentLog(data[0]);
    }
  };

  const handleLogDownload = () => {
    if(currentLog) {
      const type = currentLog!.name === 'import.log' ? 'import' : 'err';
      downloadTaskLog({
        id,
        type,
        name: currentLog.name
      });
    }
  };

  const readLog = async () => {
    const getLogDetail = currentLog!.name === 'import.log' ? getImportLogDetail : getErrLogDetail;
    const res = await getLogDetail({
      offset: offset.current,
      id,
      limit: 500,
      name: currentLog!.name
    });
    handleLogData(res);
  };

  const handleLogData = (res) => {
    const { data } = res;
    if(!logRef.current) {
      timer.current = setTimeout(readLog, 2000);
      return; 
    }
    if (data) {
      logRef.current.innerHTML += data.join('<br/>') + '<br/>';
      logRef.current.scrollTop = logRef.current.scrollHeight;
      offset.current += data.length;
      timer.current = setTimeout(readLog, 2000);
    } else if (_status.current === ITaskStatus.StatusProcessing) {
      timer.current = setTimeout(readLog, 2000);
    } else {
      offset.current = 0;
    }
  };

  useEffect(() => {
    getAllLogs();
    return () => {
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
    if(currentLog) {
      readLog();
    }
  }, [currentLog]);
  return (
    <Modal
      title={<>
        <div className={styles.importModalTitle}>
          <span>{`${space} ${intl.get('import.task')} - ${intl.get('common.log')}`}</span>
          {status === ITaskStatus.StatusProcessing && <Button type="text" loading={true} />}
        </div>
        <Button className="studioAddBtn primaryBtn" onClick={handleLogDownload}>
          <Icon type="icon-studio-btn-download" />
          {intl.get('import.downloadLog')}
        </Button>
      </>}
      width="80%"
      visible={visible}
      onCancel={onCancel}
      wrapClassName={styles.logModal}
      destroyOnClose={true}
      footer={false}
    >
      <Tabs className={styles.logTab} tabBarGutter={0} tabPosition="left" onChange={handleTabChange}>
        {logs.map(log => (
          <TabPane tab={`${log.name}`} key={log.name} />
        ))}
      </Tabs>
      <div className={styles.logContainer} ref={logRef}/>
    </Modal>
  );
};

export default LogModal;
