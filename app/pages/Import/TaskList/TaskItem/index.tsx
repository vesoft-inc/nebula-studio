import { Button, Popconfirm, Progress } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { ITaskItem, ITaskStatus } from '@app/interfaces/import';
import dayjs from 'dayjs';
import { floor } from 'lodash';
import { getFileSize } from '@app/utils/file';
import Icon from '@app/components/Icon';
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
  const [progressStatus, setStatus] = useState<'success' | 'active' | 'normal' | 'exception' | undefined>(undefined);
  const [extraMsg, setExtraMsg] = useState('');
  const { totalImportedBytes, totalBytes, numFailed, numReadFailed } = stats || {}
  const addMsg = () => {
    const info: string[] = [];
    if(numFailed > 0) {
      info.push(intl.get('import.notImported', { total: numFailed }));
    }
    if(numReadFailed > 0) {
      info.push(intl.get('import.readFailed', { total: numReadFailed }));
    }
    info.length > 0 && setExtraMsg(info.join(', '));
  };
  useEffect(() => {
    if(status === ITaskStatus.StatusFinished) {
      setStatus('success');
      addMsg();
    } else if(status === ITaskStatus.StatusProcessing) {
      setStatus('active');
      addMsg();
    } else {
      setStatus('exception');
      if(message) {
        setExtraMsg(message);
      }
    }
  }, [status]);
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
              {totalImportedBytes && <span>
                {status !== ITaskStatus.StatusFinished && `${getFileSize(totalImportedBytes)} / `}
                {getFileSize(totalBytes)}{' '}
              </span>}
              <span>{dayjs.duration(dayjs.unix(updateTime).diff(dayjs.unix(createTime))).format('HH:mm:ss')}</span>
            </div>
          </div>
          {stats && <Progress 
            format={percent => `${percent}%`}
            status={progressStatus} 
            percent={status !== ITaskStatus.StatusFinished ? floor(totalImportedBytes / totalBytes * 100, 2) : 100} 
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
          {status !== ITaskStatus.StatusProcessing && 
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
