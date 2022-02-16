import { Button, message } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';
import TaskItem from './TaskItem';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';

import { useStore } from '@appv2/stores';
import { trackPageView } from '@appv2/utils/stat';

import './index.less';
import { ITaskStatus } from '@appv2/interfaces/import';

let isMounted = true;

const TaskList = () => {
  const timer = useRef<any>(null);
  const { dataImport } = useStore();
  const history = useHistory();
  const { taskList, asyncGetTaskList, stopTask, deleteTask } = dataImport;
  const handleTaskStop = useCallback(async(id: number) => {
    clearTimeout(timer.current);
    const { code } = await stopTask(id);
    if(code === 0) {
      message.info(intl.get('import.stopImportingSuccess'));
      await asyncGetTaskList();
    }
  }, []);
  const handleTaskDelete = useCallback(async(id: number) => {
    clearTimeout(timer.current);
    const { code } = await deleteTask(id);
    if(code === 0) {
      message.info(intl.get('import.deleteSuccess'));
      await asyncGetTaskList();
    }
  }, []);
  useEffect(() => {
    isMounted = true;
    asyncGetTaskList();
    trackPageView('/import/tasks');
    return () => {
      isMounted = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    const needRefresh = taskList.filter(item => item.taskStatus === ITaskStatus.statusProcessing).length > 0;
    if(needRefresh && isMounted) {
      timer.current = setTimeout(asyncGetTaskList, 2000);
    } else {
      clearTimeout(timer.current);
    }
  }, [taskList]);
  return (
    <div className="nebula-data-import">
      <div className="task-btns">
        <Button
          className="upload-btn"
          type="primary"
          onClick={() => history.push('/import/create')}
        >
          {intl.get('import.createTask')}
        </Button>
        <Button className="upload-btn" type="default">
          {intl.get('import.uploadTemp')}
        </Button>
      </div>
      <h3 className="task-header">{intl.get('import.taskList')} ({taskList.length})</h3>
      {taskList.map(item => (
        <TaskItem key={item.taskID} data={item} handleStop={handleTaskStop} handleDelete={handleTaskDelete} />
      ))}
    </div>
  );
};

export default observer(TaskList);
