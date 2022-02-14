import { Button } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import TaskItem from './TaskItem';
import { useHistory } from 'react-router-dom';

import { observer } from 'mobx-react-lite';

import { useStore } from '@appv2/stores';
import { trackPageView } from '@appv2/utils/stat';

import './index.less';

const TaskList = () => {
  const { dataImport } = useStore();
  const history = useHistory();
  const { taskList, asyncGetTaskList } = dataImport;
  useEffect(() => {
    asyncGetTaskList();
    trackPageView('/import/tasks');
  }, []);
  return (
    <div className="nebula-data-import">
      <div className="task-btns">
        <Button
          className="upload-btn"
          type="primary"
          onClick={() => history.push('/import/create')}
        >
          New Import
        </Button>
        <Button className="upload-btn" type="default">
          Import Config.yaml
        </Button>
      </div>
      <h3 className="task-header">Task List ({taskList.length})</h3>
      {taskList.map(item => (
        <TaskItem key={item.taskID} data={item} />
      ))}
    </div>
  );
};

export default observer(TaskList);
