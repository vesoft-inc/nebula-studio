import { Button, message, Pagination, Select, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { ITaskItem, ITaskStatus } from '@app/interfaces/import';
import { useI18n } from '@vesoft-inc/i18n';
import DatasourceConfigModal from '../DatasourceList/DatasourceConfig/PlatformConfig';
import LogModal from './TaskItem/LogModal';
import TemplateModal from './TemplateModal';
import styles from './index.module.less';
import TaskItem from './TaskItem';
import Create from '../AIImport/Create';
import AIImportItem, { ILLMStatus } from './TaskItem/AIImportItem';

const Option = Select.Option;

const TaskList = () => {
  const timer = useRef<any>(null);
  const { dataImport, global, moduleConfiguration, schema } = useStore();
  const { spaces, getSpaces } = schema;
  const isMounted = useRef(true);
  const [filter, setFilter] = useState({ page: 1, pageSize: 10, space: undefined });
  const { intl, currentLocale } = useI18n();
  const history = useHistory();
  const { taskList, getTaskList, stopTask, deleteTask } = dataImport;
  const { username, host } = global;
  const [logTaskItem, setLogTaskItem] = useState<ITaskItem | undefined>();
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [aiImportModalVisible, setAiImportModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { disableTemplateImport } = moduleConfiguration.dataImport;
  const modalKey = useMemo(() => Math.random(), [sourceModalVisible]);
  const getData = useCallback(
    (params?: Partial<typeof filter>) => {
      const _filter = { ...filter, ...params };
      setFilter(_filter);
      getTaskList(_filter);
    },
    [filter],
  );
  const handleTaskStop = useCallback(async (id: string) => {
    clearTimeout(timer.current);
    const { code } = await stopTask(id);
    code === 0 && message.success(intl.get('import.stopImportingSuccess'));
    getData();
  }, []);
  const handleTaskDelete = useCallback(async (id: string) => {
    clearTimeout(timer.current);
    const { code } = await deleteTask(id);
    if (code === 0) {
      message.success(intl.get('import.deleteSuccess'));
      getData();
    }
  }, []);

  const handleLogView = useCallback((item: ITaskItem) => {
    setLogTaskItem(item);
  }, []);
  const initList = useCallback(async () => {
    setLoading(true);
    await getData({ page: 1, space: undefined });
    setLoading(false);
  }, []);
  const handleRerun = () => {
    clearTimeout(timer.current);
    getData();
  };
  useEffect(() => {
    getSpaces();
    initList();
    trackPageView('/import/tasks');
    return () => {
      isMounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    const loadingStatus = [ITaskStatus.Processing, ITaskStatus.Pending, ILLMStatus.Pending, ILLMStatus.Running];
    const needRefresh = taskList.list?.filter((item) => loadingStatus.includes(item.status)).length > 0;
    if (logTaskItem?.id !== undefined) {
      const task = taskList.list?.find((item) => item.id === logTaskItem.id);
      task && setLogTaskItem(task);
    }
    if (needRefresh && isMounted.current) {
      clearTimeout(timer.current);
      timer.current = setTimeout(getData, 1000);
    } else {
      clearTimeout(timer.current);
    }
  }, [taskList]);

  const emptyTips = useMemo(
    () => [
      {
        title: intl.get('import.newDataSource'),
        tip: intl.get('import.newDataSourceTip'),
        action: () => setSourceModalVisible(true),
        btnLabel: intl.get('import.start'),
      },
      {
        title: intl.get('import.addNewImport'),
        tip: intl.get('import.addNewImportTip'),
        action: () => history.push('/import/create'),
        btnLabel: intl.get('import.start'),
      },
    ],
    [currentLocale],
  );
  return (
    <div className={styles.nebulaDataImport}>
      <div className={styles.header}>
        <div className={styles.taskBtns}>
          <Button className="studioAddBtn" type="primary" onClick={() => history.push('/import/create')}>
            <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
            {intl.get('import.createTask')}
          </Button>
          {!disableTemplateImport && (
            <Button type="default" onClick={() => setImportModalVisible(true)}>
              {intl.get('import.uploadTemp')}
            </Button>
          )}
          {global.appSetting.beta.functions.llmImport && (
            <Button className="studioAddBtn" onClick={() => setAiImportModalVisible(true)}>
              <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
              {intl.get('llm.aiImport')}
              <span className={styles.beta}>beta</span>
            </Button>
          )}
        </div>
        <Button className="studioAddBtn" type="primary" onClick={() => setSourceModalVisible(true)}>
          <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
          {intl.get('import.newDataSource')}
        </Button>
      </div>
      <div className={styles.taskHeader}>
        <span>
          {intl.get('import.taskList')} ({taskList.total})
        </span>
        <div>
          <span className={styles.label}>{intl.get('common.currentSpace')}</span>
          <Select
            showSearch
            allowClear
            style={{ minWidth: 200, maxWidth: 600 }}
            value={filter.space}
            placeholder={intl.get('console.selectSpace')}
            onChange={(space) => getData({ space, page: 1 })}
          >
            {spaces.map((space) => (
              <Option value={space} key={space}>
                {space}
              </Option>
            ))}
          </Select>
        </div>
      </div>
      {!loading && taskList.total === 0 ? (
        <div className={styles.emptyTip}>
          {emptyTips.map((item, index) => {
            return (
              <div key={index} className={styles.box}>
                <p className={styles.step}>{index + 1}</p>
                <div className={styles.content}>
                  <div className={styles.desc}>
                    <p className={styles.title}>{item.title}</p>
                    <p className={styles.tip}>{item.tip}</p>
                  </div>
                  <Button className={styles.btn} size="small" type="primary" onClick={item.action}>
                    {item.btnLabel}
                  </Button>
                </div>
                {index !== emptyTips.length - 1 && <div className={styles.arrow} />}
              </div>
            );
          })}
        </div>
      ) : (
        <Spin spinning={loading}>
          {taskList.list.map((item) =>
            !item.llmJob ? (
              <TaskItem
                key={item.id}
                data={item}
                onRerun={handleRerun}
                onViewLog={handleLogView}
                onTaskStop={handleTaskStop}
                onTaskDelete={handleTaskDelete}
              />
            ) : (
              <AIImportItem
                onRefresh={() => {
                  getData();
                }}
                key={item.id}
                data={item}
                onViewLog={handleLogView}
              />
            ),
          )}
          <Pagination
            className={styles.taskPagination}
            hideOnSinglePage
            total={taskList.total}
            current={filter.page}
            onChange={(page) => getData({ page })}
          />
        </Spin>
      )}
      {logTaskItem && <LogModal task={logTaskItem} onCancel={() => setLogTaskItem(undefined)} visible={true} />}
      {importModalVisible && (
        <TemplateModal
          onClose={() => setImportModalVisible(false)}
          username={username}
          host={host}
          onImport={getData}
          visible={importModalVisible}
        />
      )}
      <DatasourceConfigModal
        key={modalKey}
        visible={sourceModalVisible}
        onCancel={() => setSourceModalVisible(false)}
        onConfirm={() => setSourceModalVisible(false)}
      />
      <Create
        visible={aiImportModalVisible}
        onCancel={() => {
          setAiImportModalVisible(false);
          getData();
        }}
      />
    </div>
  );
};

export default observer(TaskList);
