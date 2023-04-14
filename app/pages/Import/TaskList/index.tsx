import { Button, message, Spin } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { ITaskStatus } from '@app/interfaces/import';
import { useI18n } from '@vesoft-inc/i18n';
import DatasourceConfigModal from '../DatasourceList/DatasourceConfig/PlatformConfig';
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

interface IProps {
  showTemplateModal?: boolean;
  showConfigDownload?: boolean;
  showLogDownload?: boolean;
}

const TaskList = (props: IProps) => {
  const timer = useRef<any>(null);
  const { dataImport, global } = useStore();
  const { intl } = useI18n();
  const history = useHistory();
  const { taskList, getTaskList, stopTask, deleteTask, downloadTaskConfig } = dataImport;
  const { username, host } = global;
  const [modalVisible, setVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showTemplateModal = true, showConfigDownload = true, showLogDownload = true } = props;
  const modalKey = useMemo(() => Math.random(), [sourceModalVisible ]);
  const [logDimension, setLogDimension] = useState<ILogDimension>({} as ILogDimension);
  const handleTaskStop = useCallback(async (id: number) => {
    clearTimeout(timer.current);
    const { code } = await stopTask(id);
    code === 0 && message.success(intl.get('import.stopImportingSuccess'));
    getTaskList();
  }, []);
  const handleTaskDelete = useCallback(async (id: number) => {
    clearTimeout(timer.current);
    const { code } = await deleteTask(id);
    if(code === 0) {
      message.success(intl.get('import.deleteSuccess'));
      getTaskList();
    }
  }, []);

  const handleLogView = (id: number, space: string, status: ITaskStatus) => {
    setLogDimension({
      space, 
      id,
      status
    });
    setVisible(true);
  };
  const initList = async () => {
    setLoading(true);
    await getTaskList();
    setLoading(false);
  };
  useEffect(() => {
    isMounted = true;
    initList();
    trackPageView('/import/tasks');
    return () => {
      isMounted = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    const loadingStatus = [ITaskStatus.Processing, ITaskStatus.Pending];
    const needRefresh = taskList.filter(item => loadingStatus.includes(item.status)).length > 0;
    if(logDimension.id !== undefined && loadingStatus.includes(logDimension.status)) {
      const status = taskList.filter(item => item.id === logDimension.id)[0].status;
      if(!loadingStatus.includes(status)) {
        setLogDimension({
          id: logDimension.id,
          space: logDimension.space,
          status
        });
      }
    }
    if(needRefresh && isMounted) {
      clearTimeout(timer.current);
      timer.current = setTimeout(getTaskList, 1000);
    } else {
      clearTimeout(timer.current);
    }
  }, [taskList]);

  useEffect(() => {
    if(modalVisible === false) {
      setLogDimension({} as ILogDimension);
    }
  }, [modalVisible]);
  const emptyTips = useMemo(() => ([
    {
      title: intl.get('import.newDataSource'),
      tip: intl.get('import.newDataSourceTip'),
      action: () => setSourceModalVisible(true),
      btnLabel: intl.get('import.start')
    },
    {
      title: intl.get('import.addNewImport'),
      tip: intl.get('import.addNewImportTip'),
      action: () => history.push('/import/create'),
      btnLabel: intl.get('import.start')
    },
  ]), []);
  return (
    <div className={styles.nebulaDataImport}>
      <div className={styles.header}>
        <div className={styles.taskBtns}>
          <Button
            className="studioAddBtn"
            type="primary"
            onClick={() => history.push('/import/create')}
          >
            <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('import.createTask')}
          </Button>
          {showTemplateModal && <Button type="default" onClick={() => setImportModalVisible(true)}>
            {intl.get('import.uploadTemp')}
          </Button>}
        </div>
        <Button className="studioAddBtn" type="primary" onClick={() => setSourceModalVisible(true)}>
          <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('import.newDataSource')}
        </Button>
      </div>
      <h3 className={styles.taskHeader}>{intl.get('import.taskList')} ({taskList.length})</h3>
      {!loading && taskList.length === 0 
        ? <div className={styles.emptyTip}>
          {emptyTips.map((item, index) => {
            return (
              <div key={index} className={styles.box}>
                <p className={styles.step}>{index + 1}</p>
                <div className={styles.content}>
                  <div className={styles.desc}>
                    <p className={styles.title}>{item.title}</p>
                    <p className={styles.tip}>{item.tip}</p>
                  </div>
                  <Button className={styles.btn} size="small" type="primary" onClick={item.action}>{item.btnLabel}</Button>
                </div>
                {index !== emptyTips.length - 1 && <div className={styles.arrow} /> }
              </div>
            );
          })}
        </div>
        : <Spin spinning={loading}>
          {taskList.map(item => (
            <TaskItem key={item.id} 
              data={item}
              onViewLog={handleLogView} 
              onTaskStop={handleTaskStop} 
              onTaskDelete={handleTaskDelete} 
              onConfigDownload={downloadTaskConfig} 
              showConfigDownload={showConfigDownload}
            />
          ))}
        </Spin>
      }
      {modalVisible && <LogModal
        showLogDownload={showLogDownload}
        logDimension={logDimension}
        onCancel={() => setVisible(false)}
        visible={modalVisible} />}
      {importModalVisible && <TemplateModal
        onClose={() => setImportModalVisible(false)}
        username={username}
        host={host}
        onImport={getTaskList}
        visible={importModalVisible} />}
      <DatasourceConfigModal key={modalKey} visible={sourceModalVisible} onCancel={() => setSourceModalVisible(false)} onConfirm={() => setSourceModalVisible(false)} />
    </div>
  );
};

export default observer(TaskList);
