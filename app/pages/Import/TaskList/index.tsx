import { Button, message } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { ITaskStatus } from '@app/interfaces/import';
import LogModal from './TaskItem/LogModal';
import TemplateModal from './TemplateModal';

import styles from './index.module.less';
import TaskItem from './TaskItem';

let isMounted = true;

interface ILogDimension {
  space: string;
  id: number;
  status: ITaskStatus;
}
const TaskList = () => {
  const timer = useRef<any>(null);
  const { dataImport } = useStore();
  const history = useHistory();
  const { taskList, getTaskList, stopTask, deleteTask, downloadTaskConfig } = dataImport;
  const [modalVisible, setVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [logDimension, setLogDimension] = useState<ILogDimension>({} as ILogDimension);
  const handleTaskStop = useCallback(async (id: number) => {
    clearTimeout(timer.current);
    const { code } = await stopTask(id);
    if(code === 0) {
      message.success(intl.get('import.stopImportingSuccess'));
      getTaskList();
    }
  }, []);
  const handleTaskDelete = useCallback(async (id: number) => {
    clearTimeout(timer.current);
    const { code } = await deleteTask(id);
    if(code === 0) {
      message.success(intl.get('import.deleteSuccess'));
      getTaskList();
    }
  }, []);

  const handleLogView = (id: number, space: string, taskStatus: ITaskStatus) => {
    setLogDimension({
      space, 
      id,
      status: taskStatus
    });
    setVisible(true);
  };
  useEffect(() => {
    isMounted = true;
    getTaskList();
    trackPageView('/import/tasks');
    return () => {
      isMounted = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    const needRefresh = taskList.filter(item => item.taskStatus === ITaskStatus.StatusProcessing).length > 0;
    if(logDimension.id !== undefined && logDimension.status === ITaskStatus.StatusProcessing) {
      const status = taskList.filter(item => item.taskID === logDimension.id)[0].taskStatus;
      if(status !== ITaskStatus.StatusProcessing) {
        setLogDimension({
          id: logDimension.id,
          space: logDimension.space,
          status
        });
      }
    }
    if(needRefresh && isMounted) {
      timer.current = setTimeout(getTaskList, 2000);
    } else {
      clearTimeout(timer.current);
    }
  }, [taskList]);

  useEffect(() => {
    if(modalVisible === false) {
      setLogDimension({} as ILogDimension);
    }
  }, [modalVisible]);
  return (
    <div className={styles.nebulaDataImport}>
      <div className={styles.taskBtns}>
        <Button
          className="studioAddBtn"
          type="primary"
          onClick={() => history.push('/import/create')}
        >
          <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('import.createTask')}
        </Button>
        <Button type="default" onClick={() => setImportModalVisible(true)}>
          {intl.get('import.uploadTemp')}
        </Button>
      </div>
      <h3 className={styles.taskHeader}>{intl.get('import.taskList')} ({taskList.length})</h3>
      {taskList.map(item => (
        <TaskItem key={item.taskID} 
          data={item}
          onViewLog={handleLogView} 
          handleStop={handleTaskStop} 
          handleDelete={handleTaskDelete} 
          handleDownload={downloadTaskConfig} 
        />
      ))}
      {modalVisible && <LogModal
        logDimension={logDimension}
        onCancel={() => setVisible(false)}
        visible={modalVisible} />}
      {importModalVisible && <TemplateModal
        onClose={() => setImportModalVisible(false)}
        onImport={getTaskList}
        visible={importModalVisible} />}
    </div>
  );
};

export default observer(TaskList);
