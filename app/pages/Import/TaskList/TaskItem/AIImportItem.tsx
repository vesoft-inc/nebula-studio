import { Button, Popconfirm, Progress, Tooltip, message as antMsg } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { ITaskItem } from '@app/interfaces/import';
import dayjs from 'dayjs';
import { getFileSize } from '@app/utils/file';
import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import { observer } from 'mobx-react-lite';
import { _delete, post } from '@app/utils/http';
import React from 'react';
import styles from './index.module.less';
interface IProps {
  data: ITaskItem;
  onViewLog: (data: ITaskItem) => void;
  onRefresh: () => void;
}
export enum ILLMStatus {
  Running = 'running',
  Success = 'success',
  Failed = 'failed',
  Cancel = 'cancel',
  Pending = 'pending',
}
const llmStatusMap = {
  [ILLMStatus.Running]: 'active',
  [ILLMStatus.Success]: 'success',
  [ILLMStatus.Failed]: 'execption',
  [ILLMStatus.Cancel]: 'execption',
  [ILLMStatus.Pending]: 'normal',
};
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
const loadingStatus = [ILLMStatus.Running, ILLMStatus.Pending];
const AIImportItem = observer((props: IProps) => {
  const {
    data: { createTime, space, llmJob },
    onViewLog,
  } = props;
  const { intl } = useI18n();
  const [rerunLoading, setRerunLoading] = React.useState(false);

  const progressStatus = llmStatusMap[llmJob.status];

  const onTaskDelete = () => {
    _delete('/api/llm/import/job/' + llmJob.job_id)().then((res) => {
      if (res.code === 0) {
        antMsg.success(intl.get('common.success'));
        props.onRefresh();
      }
    });
  };

  const onTaskStop = () => {
    post('/api/llm/import/job/cancel')({ jobId: llmJob.job_id }).then((res) => {
      if (res.code === 0) {
        antMsg.success(intl.get('common.success'));
        props.onRefresh();
      }
    });
  };
  const handleRerun = async () => {
    setRerunLoading(true);
    const res = await post('/api/llm/import/job/rerun')({ jobId: llmJob.job_id });
    if (res.code === 0) {
      antMsg.success(intl.get('common.success'));
      props.onRefresh();
    }
    setRerunLoading(false);
  };

  return (
    <>
      <div className={styles.taskItem}>
        <div className={styles.row}>
          <span>
            {intl.get('common.space')}: {space}
          </span>
          <div>
            {llmJob.status === ILLMStatus.Pending ? (
              <>
                <span>
                  {intl.get('import.modifyTime')}: {dayjs(llmJob.update_time).format('YYYY-MM-DD HH:mm:ss')}
                </span>
              </>
            ) : (
              <>
                <span className={styles.createTime}>
                  {intl.get('common.createTime')}: {dayjs(createTime).format('YYYY-MM-DD HH:mm:ss')}
                </span>
                <span>
                  prompt tokens:{llmJob.process?.prompt_tokens || '-'}/ completion tokens:{' '}
                  {llmJob.process?.completion_tokens || '-'}
                </span>
              </>
            )}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.progress}>
            <div className={styles.progressInfo}>
              <span className={styles.taskName}>
                <span
                  className={styles.draftLabel}
                  style={{
                    background: 'rgba(150, 80, 247, 0.30)',
                    color: '#9650F7',
                  }}
                >
                  {intl.get('llm.aiImport')}
                </span>
                {llmJob.job_id}
                {llmJob.status === ILLMStatus.Success && (
                  <span className={styles.completeInfo}>
                    <CheckCircleFilled />
                    {intl.get('import.importCompleted')}
                    <span className={styles.red}>
                      {llmJob.process?.failed_reason && ` (${llmJob.process.failed_reason})`}
                    </span>
                  </span>
                )}
                {llmJob.status === ILLMStatus.Pending && (
                  <span className={styles.completeInfo}>{intl.get('import.importPending')}</span>
                )}
                {llmJob.status === ILLMStatus.Running && (
                  <span className={styles.completeInfo}>{intl.get('import.importRunning')}</span>
                )}
                {llmJob.status === ILLMStatus.Failed && (
                  <span className={styles.errInfo}>
                    {intl.get('import.importFailed')}
                    {llmJob.process?.failed_reason && (
                      <Tooltip title={llmJob.process.failed_reason}>{` (${llmJob.process.failed_reason.slice(
                        0,
                        20,
                      )}...)`}</Tooltip>
                    )}
                  </span>
                )}
                {llmJob.status === ILLMStatus.Cancel && (
                  <span className={styles.errInfo}>{intl.get('import.importStopped')}</span>
                )}
              </span>
              <div className={styles.moreInfo}>
                {llmJob.process && (
                  <span>
                    {`${getFileSize(llmJob.process.current)} / `}
                    {getFileSize(llmJob.process.total)}{' '}
                  </span>
                )}
              </div>
            </div>
            <Progress
              format={(percent) => `${percent.toFixed(1)}%`}
              status={progressStatus as any}
              percent={llmJob.process?.ratio * 100 || 0}
              strokeColor={progressStatus && COLOR_MAP[progressStatus]}
            />
          </div>
          <div className={styles.operations}>
            {llmJob.status !== ILLMStatus.Pending && (
              <Button className="primaryBtn" onClick={() => onViewLog(props.data)}>
                <Tooltip title={intl.get('import.viewLogs')}>
                  <Icon type="icon-studio-btn-ddl" />
                </Tooltip>
              </Button>
            )}
            {llmJob.status === ILLMStatus.Running && (
              <Popconfirm
                placement="left"
                title={intl.get('import.endImport')}
                onConfirm={onTaskStop}
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

            {!loadingStatus.includes(llmJob.status) && (
              <>
                <Button className="primaryBtn" loading={rerunLoading} onClick={handleRerun}>
                  <Tooltip title={intl.get('common.rerun')}>
                    <Icon type="icon-studio-btn-play" />
                  </Tooltip>
                </Button>
                <Popconfirm
                  placement="left"
                  title={intl.get('common.ask')}
                  onConfirm={onTaskDelete}
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
      </div>
    </>
  );
});

export default AIImportItem;
