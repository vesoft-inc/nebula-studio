import { Button, Popconfirm, Progress } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import React, { useEffect, useState, useRef } from 'react';
import { ITaskItem, ITaskStatus } from '@app/interfaces/import';
import dayjs from 'dayjs';
import { floor } from 'lodash';
import { getFileSize } from '@app/utils/file';
import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';
interface IProps {
  data: ITaskItem;
  onTaskStop: (id: number) => void;
  onTaskDelete: (id: number) => void;
  onConfigDownload: (id: number) => void;
  onViewLog: (id: number, space: string, status: ITaskStatus) => void;
  showConfigDownload: boolean;
}


const COLOR_MAP = {
  'success': {
    from: '#8EDD3F',
    to: '#27AE60',
  },
  'normal': {
    from: '#8EDD3F',
    to: '#27AE60',
  },
  'execption': {
    from: '#EB5757',
    to: '#EB5757',
  },
  'active': {
    from: '#58D7FF',
    to: '#2F80ED',
  },
};
const loadingStatus = [ITaskStatus.StatusPending, ITaskStatus.StatusProcessing];
const TaskItem = (props: IProps) => {
  const { 
    data: { 
      space,
      id, 
      name, 
      stats, 
      status, 
      message,
      updateTime, 
      createTime 
    }, 
    showConfigDownload,
    onViewLog,
    onConfigDownload,
    onTaskStop, 
    onTaskDelete } = props;
  const { intl } = useI18n();
  const [progressStatus, setStatus] = useState<'success' | 'active' | 'normal' | 'exception' | undefined>(undefined);
  const [extraMsg, setExtraMsg] = useState('');
  const { processedBytes, totalBytes, failedProcessed } = stats || {};
  const time = useRef('');
  const timeoutId = useRef<number>(null);
  const addMsg = () => {
    const info: string[] = [];
    if(failedProcessed > 0) {
      info.push(intl.get('import.notImported', { total: failedProcessed }));
    }
    info.length > 0 && setExtraMsg(info.join(', '));
  };
  useEffect(() => {
    window.clearTimeout(timeoutId.current);
    refreshTime();
    if(status === ITaskStatus.StatusFinished) {
      setStatus('success');
      addMsg();
    } else if(loadingStatus.includes(status)) {
      setStatus('active');
      addMsg();
    } else {
      setStatus('exception');
      if(message) {
        setExtraMsg(message);
      }
    }
    return () => {
      window.clearTimeout(timeoutId.current);
    };
  }, [status]);
  const refreshTime = () => {
    if(status === ITaskStatus.StatusProcessing) {
      time.current = dayjs.duration(dayjs(Date.now()).diff(dayjs(createTime))).format('HH:mm:ss');
      timeoutId.current = window.setTimeout(refreshTime, 1000);
    } else {
      time.current = dayjs.duration(dayjs(updateTime).diff(dayjs(createTime))).format('HH:mm:ss');
    }
  };
  return (
    <div className={styles.taskItem}>
      <div className={styles.row}>
        <span>{intl.get('common.space')}: {space}</span>
        {showConfigDownload && <Button type="link" size="small" onClick={() => onConfigDownload(id)}>
          <Icon type="icon-studio-btn-download" />
          {intl.get('import.downloadConfig')}
        </Button>}
      </div>
      <div className={styles.row}>
        <div className={styles.progress}>
          <div className={styles.progressInfo}>
            <span className={styles.taskName}>
              {name}
              {status === ITaskStatus.StatusFinished && <span className={styles.completeInfo}>
                <CheckCircleFilled />
                {intl.get('import.importCompleted')}
                <span className={styles.red}>{extraMsg && ` (${extraMsg})`}</span>
              </span>}
              {!stats && status === ITaskStatus.StatusPending && <span className={styles.completeInfo}>
                {intl.get('import.importPending')}
              </span>}
              {!stats && status === ITaskStatus.StatusProcessing && <span className={styles.completeInfo}>
                {intl.get('import.importRunning')}
              </span>}
              {status === ITaskStatus.StatusAborted && <span className={styles.errInfo}>
                {intl.get('import.importFailed')}
                {extraMsg && ` (${extraMsg})`}
              </span>}
              {status === ITaskStatus.StatusStoped && <span className={styles.errInfo}>
                {intl.get('import.importStopped')}
              </span>}
            </span>
            <div className={styles.moreInfo}>
              {processedBytes > 0 && <span>
                {status !== ITaskStatus.StatusFinished && `${getFileSize(processedBytes)} / `}
                {getFileSize(totalBytes)}{' '}
              </span>}
              <span>{time.current}</span>
            </div>
          </div>
          {stats && <Progress 
            format={percent => `${percent}%`}
            status={progressStatus} 
            percent={status !== ITaskStatus.StatusFinished ? floor(processedBytes / totalBytes * 100, 2) : 100} 
            strokeColor={progressStatus && COLOR_MAP[progressStatus]} />}
        </div>
        <div className={styles.operations}>
          <Button className="primaryBtn" onClick={() => onViewLog(id, space, status)}>{intl.get('import.viewLogs')}</Button>
          {status === ITaskStatus.StatusProcessing && 
          <Popconfirm
            placement="left"
            title={intl.get('import.endImport')}
            onConfirm={() => onTaskStop(id)}
            okText={intl.get('common.confirm')}
            cancelText={intl.get('common.cancel')}
          >
            <Button className="cancelBtn">{intl.get('import.endImport')}</Button>
          </Popconfirm>}
          {!loadingStatus.includes(status) && 
          <Popconfirm
            placement="left"
            title={intl.get('common.ask')}
            onConfirm={() => onTaskDelete(id)}
            okText={intl.get('common.confirm')}
            cancelText={intl.get('common.cancel')}
          >
            <Button danger={true}>{intl.get('common.delete')}</Button>
          </Popconfirm>}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
