import { Button, Modal, Tabs } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';
import { ITaskStatus } from '@app/interfaces/import';
import classnames from 'classnames';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';

interface ILogDimension {
  space: string;
  id: string;
  status: ITaskStatus;
}

interface IProps {
  logDimension: ILogDimension;
  visible: boolean;
  onCancel: () => void;
}

let isMounted = true;

const LogModal = (props: IProps) => {
  const {
    visible,
    onCancel,
    logDimension: { space, id, status },
  } = props;
  const {
    dataImport: { getLogs, downloadTaskLog, getLogDetail, envCfg },
  } = useStore();
  const { supportLogDownload } = envCfg;
  const { intl } = useI18n();
  const logRef = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);
  const offset = useRef(0);
  const _status = useRef(status);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLog, setCurrentLog] = useState<string | null>(null);
  const handleTabChange = (key: string) => {
    setCurrentLog(logs.filter((item) => item === key)[0]);
  };

  const getAllLogs = async () => {
    const { code, data } = await getLogs(id);
    if (code === 0) {
      const logs = data.names || [];
      setLogs(logs);
      setCurrentLog(logs[0]);
    }
  };

  const handleLogDownload = () => {
    if (currentLog) {
      downloadTaskLog({
        id,
        name: currentLog,
      });
    }
  };

  const readLog = async () => {
    const data = await getLogDetail({
      offset: offset.current,
      id,
      limit: 500,
      file: currentLog,
    });
    isMounted && handleLogData(data);
  };

  const handleLogData = (data) => {
    if (!logRef.current) {
      timer.current = setTimeout(readLog, 2000);
      return;
    }
    if (data && data.length > 0) {
      logRef.current.innerHTML += data.join('<br/>') + '<br/>';
      logRef.current.scrollTop = logRef.current.scrollHeight;
      offset.current += data.length;
      if (isMounted) {
        timer.current = setTimeout(readLog, 2000);
      }
    } else if ([ITaskStatus.Processing, ITaskStatus.Pending].includes(_status.current)) {
      if (isMounted) {
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
    if (supportLogDownload) {
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
    if (logRef.current) {
      logRef.current.innerHTML = '';
    }
    offset.current = 0;
    if (currentLog && isMounted) {
      readLog();
    }
  }, [currentLog]);
  const items = logs.map((log) => ({
    key: log,
    label: log,
  }));
  return (
    <Modal
      title={
        <>
          <div className={styles.importModalTitle}>
            <span>{`${space} ${intl.get('import.task')} - ${intl.get('common.log')}`}</span>
            {(loading || [ITaskStatus.Processing, ITaskStatus.Pending].includes(status)) && (
              <Button type="text" loading={true} />
            )}
          </div>
          {supportLogDownload && (
            <Button className="studioAddBtn primaryBtn" onClick={handleLogDownload}>
              <Icon type="icon-studio-btn-download" />
              {intl.get('import.downloadLog')}
            </Button>
          )}
        </>
      }
      width="80%"
      open={visible}
      onCancel={onCancel}
      wrapClassName={styles.logModal}
      destroyOnClose={true}
      footer={false}
    >
      {supportLogDownload && (
        <Tabs className={styles.logTab} tabBarGutter={0} tabPosition="left" onChange={handleTabChange} items={items} />
      )}
      <div className={classnames(styles.logContainer, !supportLogDownload && styles.full)} ref={logRef} />
    </Modal>
  );
};

export default LogModal;
