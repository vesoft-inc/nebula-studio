import { Button, Popconfirm, Radio, Table, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import Icon from '@app/components/Icon';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { sortByFieldAndFilter } from '@app/utils/function';
import { IIndexList, IndexType, IJobStatus } from '@app/interfaces/schema';
import { groupBy } from 'lodash';
import Cookie from 'js-cookie';
import CommonLayout from '../CommonLayout';

import commonStyles from '../CommonLayout/index.module.less';
import styles from './index.module.less';

function renderIndexInfo(index: IIndexList) {
  const fieldsColumn = [
    {
      title: intl.get('common.propertyName'),
      dataIndex: 'Field',
    },
    {
      title: intl.get('common.dataType'),
      dataIndex: 'Type',
    }
  ];
  return (
    <div>
      <p>
        {index.name} {intl.get('common.relatedProperties')}:
      </p>
      <Table
        columns={fieldsColumn}
        dataSource={index.fields}
        rowKey="Field"
        pagination={false}
      />
    </div>
  );
}

const IndexList = () => {
  const { module } = useParams() as { module: string };
  const { schema: { indexList, deleteIndex, getIndexList, rebuildIndex, getIndexesStatus, currentSpace } } = useStore();
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [indexType, setIndexType] = useState<any>(module as any || 'tag');
  const [rebuildList, setRebuildList] = useState<string[] | null>(null);
  const rebuildTimer = useRef<number>();
  const history = useHistory();
  const getData = async () => {
    setLoading(true);
    await getIndexList(indexType);
    await getRebuildStatus(indexType, rebuildList);
    setSearchVal('');
    setLoading(false);
  };
  const handleDeleteIndex = async (event, type: IndexType, name: string) => {
    event.stopPropagation();
    const res = await deleteIndex({ type, name });
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      getData();
    }
  };

  const checkIsFinished = (data, prev) => {
    if(prev?.length > 0) {
      const finished = prev?.filter(i => data[IJobStatus.Finished]?.some(item => item.Name === i));
      const failed = prev?.filter(i => data[IJobStatus.Failed]?.some(item => item.Name === i));
      if(finished?.length > 0) {
        message.success(intl.get('schema.rebuildSuccess', { names: finished.join(', ') }));
      }
      if(failed?.length > 0) {
        message.error(intl.get('schema.rebuildFailed', { names: failed.join(', ') }));
      }
    }
  };
  const getRebuildStatus = async (type: IndexType, prev) => {
    rebuildTimer.current && clearTimeout(rebuildTimer.current);
    const data = await getIndexesStatus(type);
    if (data && data.length > 0) {
      const result = groupBy(data, item => item['Index Status']);
      const loading = [...result[IJobStatus.Queue] || [], ...result[IJobStatus.Running] || []].map(item => item.Name);
      checkIsFinished(result, prev);
      setRebuildList(loading);
      if(loading.length > 0) {
        rebuildTimer.current = window.setTimeout(() => {
          getRebuildStatus(type, loading);
        }, 2000);
      }
    } else {
      setRebuildList([]);
      rebuildTimer.current && clearTimeout(rebuildTimer.current);
    }
  };

  const handleRebuild = async (event, type: IndexType, name: string) => {
    event.stopPropagation();
    const res = await rebuildIndex({
      type,
      name,
    });
    if (res.code === 0) {
      message.success(intl.get('schema.startRebuildIndex', { name }));
      const _list = [...rebuildList, name];
      await setRebuildList(_list);
      getRebuildStatus(type, _list);
    }
  };
  const columns = useMemo(() => [
    {
      title: intl.get('common.name'),
      dataIndex: 'name',
      width: '33%',
    },
    {
      title:
        indexType === 'tag'
          ? intl.get('common.tag')
          : intl.get('common.edge'),
      dataIndex: 'owner',
    },
    {
      title: intl.get('common.comment'),
      dataIndex: 'comment',
    },
    {
      title: intl.get('common.operation'),
      dataIndex: 'operation',
      render: (_, index) => {
        const isRebuild = rebuildList?.some(i => i === index.name);
        if (index.name) {
          return (
            <div className={commonStyles.operation}>
              <Button 
                loading={isRebuild} 
                onClick={(e) => handleRebuild(e, indexType, index.name)}
                className="primaryBtn">
                {intl.get('schema.rebuild')}
              </Button>
              <Popconfirm
                onConfirm={(e) => {
                  e.stopPropagation();
                  handleDeleteIndex(e, indexType, index.name);
                }}
                title={intl.get('common.ask')}
                okText={intl.get('common.ok')}
                cancelText={intl.get('common.cancel')}
              >
                <Button type="link" className="warningBtn" onClick={e => e.stopPropagation()}>
                  <Icon type="icon-studio-btn-delete" />
                </Button>
              </Popconfirm>
            </div>
          );
        }
      },
    },
  ], [indexType, Cookie.get('lang'), rebuildList]);

  const handleTabChange = e => {
    rebuildTimer.current && clearTimeout(rebuildTimer.current);
    setIndexType(e.target.value);
    setRebuildList([]);
    history.replace(`/schema/index/list/${e.target.value}`);
  };
  useEffect(() => {
    rebuildTimer.current && clearTimeout(rebuildTimer.current);
    if(currentSpace) {
      module && setIndexType(module as IndexType);
      getData();
    }
    return () => {
      rebuildTimer.current && clearTimeout(rebuildTimer.current);
    };
  }, [module, currentSpace]);
  useEffect(() => {
    setData(sortByFieldAndFilter({
      field: 'name',
      searchVal,
      list: indexList,
    }));
  }, [indexList, searchVal]);
  return <CommonLayout 
    loading={loading}
    data={data}
    type="index"
    indexType={indexType}
    columns={columns}
    renderExpandInfo={renderIndexInfo}
    onSearch={setSearchVal} >
    <div className={styles.indexTabHeader}>
      <Radio.Group
        className="studioTabGroup"
        value={indexType}
        buttonStyle="solid"
        onChange={handleTabChange}
      >
        <Radio.Button value="tag">{intl.get('common.tag')}</Radio.Button>
        <Radio.Button value="edge">{intl.get('common.edge')}</Radio.Button>
      </Radio.Group>
    </div>
  </CommonLayout>;
};

export default observer(IndexList);
