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
  handleStop: (id: number) => void;
  handleDelete: (id: number) => void;
  handleDownload: (id: number) => void;
  onViewLog: (id: number, space: string, taskStatus: ITaskStatus) => void;
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
      taskID, 
      name, 
      stats: { totalImportedBytes, totalBytes, numFailed, numReadFailed }, 
      taskStatus, 
      taskMessage,
      updatedTime, 
      createdTime 
    }, 
    onViewLog,
    handleDownload,
    handleStop, 
    handleDelete } = props;
  const [status, setStatus] = useState<'success' | 'active' | 'normal' | 'exception' | undefined>(undefined);
  const [extraMsg, setExtraMsg] = useState('');
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
    if(taskStatus === ITaskStatus.StatusFinished) {
      setStatus('success');
      addMsg();
    } else if(taskStatus === ITaskStatus.StatusProcessing) {
      setStatus('active');
      addMsg();
    } else {
      setStatus('exception');
      if(taskMessage) {
        setExtraMsg(taskMessage);
      }
    }
  }, [taskStatus]);
  return (
    <div className={styles.taskItem}>
      <div className={styles.row}>
        <span>{intl.get('common.space')}: {space}</span>
        <Button type="link" size="small" onClick={() => handleDownload(taskID)}>
          <Icon type="icon-studio-btn-download" />
          {intl.get('import.downloadConfig')}
        </Button>
      </div>
      <div className={styles.row}>
        <div className={styles.progress}>
          <div className={styles.progressInfo}>
            <span className={styles.taskName}>
              {name}
              {taskStatus === ITaskStatus.StatusFinished && <span className={styles.completeInfo}>
                <CheckCircleFilled />
                {intl.get('import.importCompleted')}
                <span className={styles.red}>{extraMsg && ` (${extraMsg})`}</span>
              </span>}
              {taskStatus === ITaskStatus.StatusAborted && <span className={styles.errInfo}>
                {intl.get('import.importFailed')}
                {extraMsg && ` (${extraMsg})`}
              </span>}
              {taskStatus === ITaskStatus.StatusStoped && <span className={styles.errInfo}>
                {intl.get('import.importStopped')}
              </span>}
            </span>
            <div className={styles.moreInfo}>
              <span>
                {taskStatus !== ITaskStatus.StatusFinished && `${getFileSize(totalImportedBytes)} / `}
                {getFileSize(totalBytes)}{' '}
              </span>
              <span>{dayjs.duration(dayjs.unix(updatedTime).diff(dayjs.unix(createdTime))).format('HH:mm:ss')}</span>
            </div>
          </div>
          <Progress 
            format={percent => `${percent}%`}
            status={status} 
            percent={taskStatus !== ITaskStatus.StatusFinished ? floor(totalImportedBytes / totalBytes * 100, 2) : 100} 
            strokeColor={status && COLOR_MAP[status]} />
        </div>
        <div className={styles.operations}>
          <Button className="primaryBtn" onClick={() => onViewLog(taskID, space, taskStatus)}>{intl.get('import.viewLogs')}</Button>
          {taskStatus === ITaskStatus.StatusProcessing && 
          <Popconfirm
            placement="left"
            title={intl.get('import.endImport')}
            onConfirm={() => handleStop(taskID)}
            okText={intl.get('common.confirm')}
            cancelText={intl.get('common.cancel')}
          >
            <Button className="cancelBtn">{intl.get('import.endImport')}</Button>
          </Popconfirm>}
          {taskStatus !== ITaskStatus.StatusProcessing && 
          <Popconfirm
            placement="left"
            title={intl.get('common.ask')}
            onConfirm={() => handleDelete(taskID)}
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
