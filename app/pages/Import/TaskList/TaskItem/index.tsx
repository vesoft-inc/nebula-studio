import { Button, Popconfirm, Progress, Tooltip, message as antMsg } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { useEffect, useState, useRef, useMemo } from 'react';
import { ITaskItem, ITaskStatus } from '@app/interfaces/import';
import dayjs from 'dayjs';
import { floor } from 'lodash';
import { getFileSize } from '@app/utils/file';
import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { useHistory } from 'react-router-dom';
import { safeParse } from '@app/utils/function';
import ConfigConfirmModal from '../../TaskCreate/ConfigConfirmModal';
import styles from './index.module.less';
interface IProps {
  data: ITaskItem;
  onTaskStop: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onViewLog: (task: ITaskItem) => void;
  onRerun: () => void;
}

const COLOR_MAP = {
  success: {
    from: '#8EDD3F',
    to: '#27AE60',
  },
  normal: {
    from: '#8EDD3F',
    to: '#27AE60',
  },
  execption: {
    from: '#EB5757',
    to: '#EB5757',
  },
  active: {
    from: '#58D7FF',
    to: '#2F80ED',
  },
};
const loadingStatus = [ITaskStatus.Pending, ITaskStatus.Processing];
const TaskItem = (props: IProps) => {
  const {
    data: { space, id, name, stats, status, message, updateTime, createTime, rawConfig },
    onViewLog,
    onRerun,
    onTaskStop,
    onTaskDelete,
  } = props;
  const { intl } = useI18n();
  const {
    dataImport: { downloadTaskConfig, importTask },
    schema,
    moduleConfiguration,
    global: { platform }
  } = useStore();
  const history = useHistory();
  const { disableConfigDownload, needPwdConfirm } = moduleConfiguration.dataImport;
  const isDraft = useMemo(() => status === ITaskStatus.Draft, [status]);
  const [visible, setVisible] = useState(false);
  const [progressStatus, setStatus] = useState<'success' | 'active' | 'normal' | 'exception' | undefined>(undefined);
  const [extraMsg, setExtraMsg] = useState('');
  const { processedBytes, totalBytes, failedProcessed } = stats || {};
  const time = useRef('');
  const timeoutId = useRef<number>(null);
  const [rerunLoading, setRerunLoading] = useState(false);
  const fromTemplate = useMemo(() => rawConfig && typeof safeParse(rawConfig) === 'string', [rawConfig]);
  const addMsg = () => failedProcessed > 0 && setExtraMsg(intl.get('import.notImported', { total: failedProcessed }));
  useEffect(() => {
    window.clearTimeout(timeoutId.current);
    refreshTime();
    if (status === ITaskStatus.Finished) {
      setStatus('success');
      addMsg();
    } else if (loadingStatus.includes(status)) {
      setStatus('active');
      addMsg();
    } else {
      setStatus('exception');
      if (message) {
        setExtraMsg(message);
      }
    }
    return () => {
      window.clearTimeout(timeoutId.current);
    };
  }, [status]);
  const refreshTime = () => {
    if (status === ITaskStatus.Processing) {
      time.current = dayjs.duration(dayjs(Date.now()).diff(dayjs(createTime))).format('HH:mm:ss');
      timeoutId.current = window.setTimeout(refreshTime, 1000);
    } else {
      time.current = dayjs.duration(dayjs(updateTime).diff(dayjs(createTime))).format('HH:mm:ss');
    }
  };

  const handleEdit = () => {
    if (!rawConfig) {
      antMsg.info(intl.get('import.editTaskError'));
      return;
    }
    if (fromTemplate) {
      antMsg.info(intl.get('import.templateRerunTip'));
      return;
    }
    history.push(`/import/edit/${id}`, {
      id,
      space,
      cfg: rawConfig,
      isDraft,
    });
  };

  const handleRerun = () => {
    if (!rawConfig) {
      antMsg.info(intl.get('import.rerunError'));
      return;
    }
    if (needPwdConfirm && !fromTemplate) {
      setVisible(true);
      return;
    }
    startRerun();
  };

  const startRerun = async (password?: string) => {
    setVisible(false);
    setRerunLoading(true);
    const spaceVidType = await schema.getSpaceVidType(space);
    const config = JSON.parse(rawConfig);
    const payload = {
      name: `task-${Date.now()}`,
      password,
      type: 'rerun',
    } as any;
    if (fromTemplate) {
      payload.template = config;
    } else {
      const { basicConfig, tagConfig, edgeConfig } = config;
      payload.config = {
        space,
        spaceVidType,
        basicConfig,
        tagConfig,
        edgeConfig,
      };
    }
    const code = await importTask(payload);
    setRerunLoading(false);
    if (code === 0) {
      antMsg.success(intl.get('import.startImporting'));
      onRerun();
    }
  };
  return (
    <>
      <div className={styles.taskItem}>
        <div className={styles.row}>
          <span>
            {intl.get('common.space')}: {space}
          </span>
          <div>
            {isDraft ? (
              <>
                <span>
                  {intl.get('import.modifyTime')}: {dayjs(updateTime).format('YYYY-MM-DD HH:mm:ss')}
                </span>
              </>
            ) : (
              <>
                <span className={styles.createTime}>
                  {intl.get('common.createTime')}: {dayjs(createTime).format('YYYY-MM-DD HH:mm:ss')}
                </span>
                {!disableConfigDownload && (
                  <Button type="link" size="small" onClick={() => downloadTaskConfig(id)}>
                    <Icon type="icon-studio-btn-download" />
                    {intl.get('import.downloadConfig')}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.progress}>
            <div className={styles.progressInfo}>
              <span className={styles.taskName}>
                {isDraft && <span className={styles.draftLabel}>{intl.get('import.draft')}</span>}
                {name}
                {status === ITaskStatus.Finished && (
                  <span className={styles.completeInfo}>
                    <CheckCircleFilled />
                    {intl.get('import.importCompleted')}
                    <span className={styles.red}>{extraMsg && ` (${extraMsg})`}</span>
                  </span>
                )}
                {!stats && status === ITaskStatus.Pending && (
                  <span className={styles.completeInfo}>{intl.get('import.importPending')}</span>
                )}
                {!stats && status === ITaskStatus.Processing && (
                  <span className={styles.completeInfo}>{intl.get('import.importRunning')}</span>
                )}
                {status === ITaskStatus.Aborted && (
                  <span className={styles.errInfo}>
                    {intl.get('import.importFailed')}
                    {extraMsg && ` (${extraMsg})`}
                  </span>
                )}
                {status === ITaskStatus.Stoped && (
                  <span className={styles.errInfo}>{intl.get('import.importStopped')}</span>
                )}
              </span>
              <div className={styles.moreInfo}>
                {processedBytes > 0 && (
                  <span>
                    {status !== ITaskStatus.Finished && `${getFileSize(processedBytes)} / `}
                    {getFileSize(totalBytes)}{' '}
                  </span>
                )}
                {!isDraft && <span>{time.current}</span>}
              </div>
            </div>
            {stats && (
              <Progress
                format={(percent) => `${percent}%`}
                status={progressStatus}
                percent={status !== ITaskStatus.Finished ? floor((processedBytes / totalBytes) * 100, 2) : 100}
                strokeColor={progressStatus && COLOR_MAP[progressStatus]}
              />
            )}
          </div>
          <div className={styles.operations}>
            <Button className="primaryBtn" onClick={handleEdit}>
              <Tooltip title={intl.get('common.edit')}>
                <Icon type="icon-studio-btn-edit" />
              </Tooltip>
            </Button>
            {platform !== 'cloud' && !isDraft && !loadingStatus.includes(status) && (
              <Button className="primaryBtn" onClick={() => onViewLog(props.data)}>
                <Tooltip title={intl.get('import.viewLogs')}>
                  <Icon type="icon-studio-btn-ddl" />
                </Tooltip>
              </Button>
            )}
            {status === ITaskStatus.Processing && (
              <Popconfirm
                placement="left"
                title={intl.get('import.endImport')}
                onConfirm={() => onTaskStop(id)}
                okText={intl.get('common.confirm')}
                cancelText={intl.get('common.cancel')}
              >
                <Button className="warningBtn">
                  <Tooltip title={intl.get('import.endImport')}>
                    <Icon type="icon-studio-btn-close" />
                  </Tooltip>
                </Button>
              </Popconfirm>
            )}

            {!loadingStatus.includes(status) && (
              <>
                {!isDraft && (
                  <Button className="primaryBtn" loading={rerunLoading} onClick={handleRerun}>
                    <Tooltip title={intl.get('common.rerun')}>
                      <Icon type="icon-studio-btn-play" />
                    </Tooltip>
                  </Button>
                )}
                <Popconfirm
                  placement="left"
                  title={intl.get('common.ask')}
                  onConfirm={() => onTaskDelete(id)}
                  okText={intl.get('common.confirm')}
                  cancelText={intl.get('common.cancel')}
                >
                  <Button danger={true} className="warningBtn">
                    <Tooltip title={intl.get('common.delete')}>
                      <Icon type="icon-studio-btn-delete" />
                    </Tooltip>
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>
        </div>
        {visible && (
          <ConfigConfirmModal
            visible={visible}
            config={JSON.parse(rawConfig)}
            onConfirm={startRerun}
            onCancel={() => setVisible(false)}
          />
        )}
      </div>
    </>
  );
};

export default observer(TaskItem);
