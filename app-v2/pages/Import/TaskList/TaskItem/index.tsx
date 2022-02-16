import { Button, Popconfirm, Progress } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import './index.less';
import { ITaskItem, ITaskStatus } from '@appv2/interfaces/import';
import dayjs from 'dayjs';
interface IProps {
  data: ITaskItem;
  handleStop: (id: number) => void
  handleDelete: (id: number) => void
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
    from: '#8EDD3F',
    to: '#27AE60',
  },
};
const TaskItem = (props: IProps) => {
  const { 
    data: { 
      space,
      taskID, 
      name, 
      statsQuery: { TotalCount, TotalLine }, 
      taskStatus, 
      updatedTime, 
      createdTime 
    }, 
    handleStop, 
    handleDelete } = props;
  const [status, setStatus] = useState<'success' | 'active' | 'normal' | 'exception' | undefined>(undefined);

  useEffect(() => {
    if(taskStatus === ITaskStatus.statusFinished) {
      setStatus('success');
    } else if(taskStatus === ITaskStatus.statusProcessing) {
      setStatus('active');
    } else {
      setStatus('exception');
    }
  }, [taskStatus]);
  return (
    <div className="task-item">
      <div className="row">
        <span>{intl.get('common.space')}: {space}</span>
        <Button type="link" size="small">{intl.get('import.downloadConfig')}</Button>
      </div>
      <div className="row">
        <div className="progress">
          <div className="progress-info">
            <span className="task-name">{name}</span>
            <div className="more-info">
              <span>
                {TotalCount} {intl.get('import.lines')} / {TotalLine}{' '}
                {intl.get('import.lines')}
              </span>
              <span>{dayjs.duration(dayjs.unix(updatedTime).diff(dayjs.unix(createdTime))).format('HH:mm:ss')}</span>
            </div>
          </div>
          <Progress status={status} percent={TotalCount / TotalLine * 100} strokeColor={status && COLOR_MAP[status]} />
        </div>
        <div className="operations">
          <Button>{intl.get('import.details')}</Button>
          <Button>{intl.get('import.viewLogs')}</Button>
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
            title={intl.get('common.delete')}
            onConfirm={() => handleDelete(taskID)}
            okText={intl.get('common.confirm')}
            cancelText={intl.get('common.cancel')}
          >
            <Button>{intl.get('common.delete')}</Button>
          </Popconfirm>}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
