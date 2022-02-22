import { Button, Popconfirm, Progress } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import './index.less';
import { ITaskItem, ITaskStatus } from '@appv2/interfaces/import';
import dayjs from 'dayjs';
import { floor } from 'lodash';
interface IProps {
  data: ITaskItem;
  handleStop: (id: number) => void;
  handleDelete: (id: number) => void;
  handleDownload: (id: number) => void;
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
      statsQuery: { totalCount, totalLine, numFailed, numReadFailed }, 
      taskStatus, 
      taskMessage,
      updatedTime, 
      createdTime 
    }, 
    handleDownload,
    handleStop, 
    handleDelete } = props;
  const [status, setStatus] = useState<'success' | 'active' | 'normal' | 'exception' | undefined>(undefined);
  const [extraMsg, setExtraMsg] = useState('');
  useEffect(() => {
    if(taskStatus === ITaskStatus.statusFinished) {
      setStatus('success');
    } else if(taskStatus === ITaskStatus.statusProcessing) {
      setStatus('active');
      const info: string[] = [];
      if(numFailed > 0) {
        info.push(intl.get('import.notImported', { numFailed }));
      }
      if(numReadFailed > 0) {
        info.push(intl.get('import.readFailed', { numReadFailed }));
      }
      info.length > 0 && setExtraMsg(info.join(', '));
    } else {
      setStatus('exception');
      if(taskMessage) {
        setExtraMsg(taskMessage);
      }
    }
  }, [taskStatus]);
  return (
    <div className="task-item">
      <div className="row">
        <span>{intl.get('common.space')}: {space}</span>
        <Button type="link" size="small" onClick={() => handleDownload(taskID)}>{intl.get('import.downloadConfig')}</Button>
      </div>
      <div className="row">
        <div className="progress">
          <div className="progress-info">
            <span className="task-name">
              {name}
              {taskStatus === ITaskStatus.statusFinished && <span className="complete-info">
                <CheckCircleFilled />
                {intl.get('import.importCompleted')}
                {extraMsg && ` (${extraMsg})`}
              </span>}
              {taskStatus === ITaskStatus.statusAborted && <span className="error-info">
                {intl.get('import.importFailed')}
                {extraMsg && ` (${extraMsg})`}
              </span>}
              {taskStatus === ITaskStatus.statusStoped && <span className="error-info">
                {intl.get('import.importStopped')}
              </span>}
            </span>
            <div className="more-info">
              <span>
                {taskStatus !== ITaskStatus.statusFinished && `${totalCount} ${intl.get('import.lines')} / `}
                {totalLine}{' '}{intl.get('import.lines')}
              </span>
              <span>{dayjs.duration(dayjs.unix(updatedTime).diff(dayjs.unix(createdTime))).format('HH:mm:ss')}</span>
            </div>
          </div>
          <Progress 
            status={status} 
            percent={taskStatus !== ITaskStatus.statusFinished ? floor(totalCount / totalLine * 100, 2) : 100} 
            strokeColor={status && COLOR_MAP[status]} />
        </div>
        <div className="operations">
          <Button>{intl.get('import.details')}</Button>
          <Button type="primary">{intl.get('import.viewLogs')}</Button>
          {taskStatus === ITaskStatus.statusProcessing && 
          <Popconfirm
            placement="left"
            title={intl.get('import.endImport')}
            onConfirm={() => handleStop(taskID)}
            okText={intl.get('common.confirm')}
            cancelText={intl.get('common.cancel')}
          >
            <Button>{intl.get('import.endImport')}</Button>
          </Popconfirm>}
          {taskStatus !== ITaskStatus.statusProcessing && 
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