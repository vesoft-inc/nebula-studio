import { Button, Modal, Tabs } from 'antd';
import { useEffect, useRef, useState } from 'react';
import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';
import { ITaskItem, ITaskStatus } from '@app/interfaces/import';
import classnames from 'classnames';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';

interface IProps {
  task: ITaskItem;
  visible: boolean;
  onCancel: () => void;
}

const LogModal = (props: IProps) => {
  const { visible, onCancel, task } = props;
  const { id, space, status, llmJob } = task;
  const {
    dataImport: { getLogs, downloadTaskLog, getLogDetail },
    moduleConfiguration,
  } = useStore();
  const { disableLogDownload } = moduleConfiguration.dataImport;
  const { intl } = useI18n();
  const logRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLog, setCurrentLog] = useState<string | null>(null);
  const [logData, setLogData] = useState<string[]>([]);

  const handleTabChange = (key: string) => {
    setCurrentLog(logs.filter((item) => item === key)[0]);
  };

  const getAllLogs = async () => {
    if (!llmJob) {
      const { code, data } = await getLogs(id);
      if (code === 0) {
        const logs = data.names || [];
        setLogs(logs);
        setCurrentLog(logs[0]);
      }
    } else {
      setLogs(['all.log']);
      setCurrentLog('all.log');
    }
  };

  const handleLogDownload = () => currentLog && downloadTaskLog({ id, name: currentLog });

  const readLog = async () => {
    const data = await getLogDetail(task);
    handleLogData(data);
  };

  const handleLogData = (data) => {
    const logs = data?.logs || '';
    if (!logs.length) {
      return;
    }
    setLogData(logs.split('\n'));
    /**
     * {"level":"info",...}
     * {"level":"info",...}
     *
     * ...
     * (200 lines more, original log file path: /.../tasks/nck3vu9b7id2r67lvi1b0/import.log, hostname: xxx)
     * ...
     *
     * {"level":"info",...}
     * {"level":"info",...}
     */
    // logRef.current.innerHTML = logs
    //   .split('\n')
    //   .map((log) => `<code style="color:${/^(\.\.\.)|^\(\d+/.test(log) ? '#fff' : '#e8c18b'}">${log}</code>`)
    //   .join('<br/>');
    // logRef.current.scrollTop = logRef.current.scrollHeight;
  };

  const initLog = async () => {
    setLoading(true);
    await readLog();
    setLoading(false);
  };

  useEffect(() => {
    if (!disableLogDownload) {
      getAllLogs();
    } else {
      initLog();
    }
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.innerHTML = '';
    }
    currentLog && initLog();
  }, [currentLog]);

  const items = logs.map((log) => ({ key: log, label: log }));

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
          {!disableLogDownload && (
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
      <Tabs className={styles.logTab} tabBarGutter={0} tabPosition="left" onChange={handleTabChange} items={items} />
      <div className={classnames(styles.logContainer, !disableLogDownload && styles.full)}>
        {logData.map((log, index) => {
          return (
            <pre key={index} style={{ color: /^(\.\.\.)|^\(\d+/.test(log) ? '#fff' : '#e8c18b' }}>
              {log}
            </pre>
          );
        })}
      </div>
    </Modal>
  );
};

export default LogModal;
