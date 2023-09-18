import { Button, Table, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { IJobStatus } from '@app/interfaces/schema';
import { trackPageView } from '@app/utils/stat';
import Cookie from 'js-cookie';
import EmptyTableTip from '@app/components/EmptyTableTip';
import styles from './index.module.less';

const SpaceStats = () => {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const { intl } = useI18n();
  const {
    schema: { getJobStatus, submitStats, getStats, currentSpace },
  } = useStore();
  const [data, setData] = useState<{
    list: {
      Type: string;
      Name: string;
      Count: number;
    }[];
    total?: {
      vertices: number;
      edges: number;
    };
  }>({ list: [], total: undefined });
  const [updateTime, setUpdateTime] = useState('');
  const [jobId, setJobId] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const columns = useMemo(
    () => [
      {
        title: intl.get('schema.statsType'),
        dataIndex: 'Type',
      },
      {
        title: intl.get('schema.statsName'),
        dataIndex: 'Name',
      },
      {
        title: intl.get('schema.statsCount'),
        dataIndex: 'Count',
      },
    ],
    [Cookie.get('lang')],
  );
  useEffect(() => {
    trackPageView('/space/stats');
    initData();
    getJobs();
    return () => {
      timer.current && clearTimeout(timer.current);
    };
  }, [currentSpace]);

  const initData = () => {
    setJobId(null);
    setUpdateTime('');
    setData({
      list: [],
      total: undefined,
    });
  };

  const getData = async () => {
    const { code, data } = await getStats();
    if (code === 0) {
      const _data = data.tables.reduce(
        (prev, cur) => {
          if (cur.Type === 'Space') {
            prev.total ||= { vertex: 0, edge: 0 };
            prev.total[cur.Name] = cur.Count;
          } else {
            prev.list.push(cur);
          }
          return prev;
        },
        { list: [], total: undefined },
      );
      setData(_data);
    }
  };

  const getJobs = async () => {
    const { code, data } = await getJobStatus();
    if (code === 0) {
      const stat = data.tables.filter((item) => item.Command === 'STATS')[0];
      if (stat?.Status === IJobStatus.Finished) {
        getData();
        setUpdateTime(stat['Stop Time']);
      } else if (stat) {
        const jobId = stat['Job Id'];
        setJobId(jobId);
        getStatStatus(jobId, true);
      }
    }
  };

  const getStatStatus = async (id, isInit?: boolean) => {
    const { code, data } = await getJobStatus(id);
    if (code === 0) {
      const job = data.tables[0];
      if (job.Status === IJobStatus.Finished) {
        getData();
        setUpdateTime(job['Stop Time']);
        setJobId(null);
        !isInit && message.success(intl.get('schema.statFinished'));
      } else if ([IJobStatus.Running, IJobStatus.Queue].includes(job.Status)) {
        timer.current = setTimeout(() => getStatStatus(id), 2000);
      } else if (job.Status === 'FAILED') {
        !isInit && message.warning(intl.get('schema.statError'));
        setJobId(null);
      }
    }
  };
  const handleSubmitStats = async () => {
    setLoading(true);
    const { code, data } = await submitStats();
    setLoading(false);
    if (code === 0) {
      const id = data.tables[0]['New Job Id'];
      setJobId(id);
      await getStatStatus(id);
    }
  };
  const showTime = updateTime && jobId == null && !loading;
  console.log('=====updateTime', updateTime);
  return (
    <div className={styles.nebulaStats}>
      <div className={styles.row}>
        <div className={styles.operations}>
          <Button type="primary" onClick={handleSubmitStats} loading={loading || jobId !== null}>
            {intl.get(updateTime ? 'schema.refresh' : 'schema.startStat')}
          </Button>
          {showTime ? (
            <>
              <span className={styles.label}>{intl.get('schema.lastRefreshTime')}</span>
              <span>{dayjs(updateTime).format('YYYY-MM-DD HH:mm:ss')}</span>
            </>
          ) : (
            <span className={styles.tip}>{intl.get('schema.statTip')}</span>
          )}
        </div>
        {data?.total && (
          <div className={styles.totalCount}>
            <div className={styles.totalItem}>
              <span className={styles.label}>{intl.get('schema.totalVertices')}</span>
              <span>{data.total.vertices}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.label}>{intl.get('schema.totalEdges')}</span>
              <span>{data.total.edges}</span>
            </div>
          </div>
        )}
      </div>
      <Table
        dataSource={data?.list || []}
        columns={columns}
        rowKey="Name"
        locale={{ emptyText: <EmptyTableTip text={intl.get('empty.stats')} tip={intl.get('empty.statsTip')} /> }}
      />
    </div>
  );
};

export default observer(SpaceStats);
