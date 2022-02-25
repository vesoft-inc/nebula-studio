import { Button, Popconfirm, Radio, Table, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import Icon from '@app/components/Icon';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { sortByFieldAndFilter } from '@app/utils/function';
import { IIndexList, IndexType } from '@app/interfaces/schema';
import CommonLayout from '../CommonLayout';
import Cookie from 'js-cookie';

import './index.less';

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
      <p className="table-inner-title">
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
  const { space, module } = useParams() as {space :string, module: string};
  const { schema: { indexList, deleteIndex, getIndexList, rebuildIndex, getRebuildIndexes } } = useStore();
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [indexType, setIndexType] = useState<any>(module as any || 'tag');
  const [rebuildList, setRebuildList] = useState<IIndexList[] | null>(null);
  const rebuildTimer = useRef<NodeJS.Timeout | null>(null);
  const history = useHistory();
  const getData = async() => {
    setLoading(true);
    await getIndexList(indexType);
    await getRebuildData(indexType);
    setSearchVal('');
    setLoading(false);
  };
  const handleDeleteIndex = async(event, type: IndexType, name: string) => {
    event.stopPropagation();
    const res = await deleteIndex({ type, name });
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      getData();
    }
  };

  const getRebuildData = async(type: IndexType) => {
    rebuildTimer.current && clearTimeout(rebuildTimer.current);
    const data = await getRebuildIndexes(type);
    if (data && data.length > 0) {
      setRebuildList(data);
      rebuildTimer.current = setTimeout(() => {
        getRebuildData(type);
      }, 2000);
    } else {
      setRebuildList([]);
      rebuildTimer.current && clearTimeout(rebuildTimer.current);
    }
  };

  const handleRebuild = async(event, type: IndexType, name: string) => {
    event.stopPropagation();
    const res = await rebuildIndex({
      type,
      name,
    });
    if (res.code === 0) {
      getRebuildData(type);
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
            <div className="operation">
              <Button 
                loading={isRebuild} 
                onClick={(e) => handleRebuild(e, indexType, index.name)}
                className="primary-btn">
                {intl.get('schema.rebuild')}
              </Button>
              <Popconfirm
                onConfirm={(e) => {
                  handleDeleteIndex(e, indexType, index.name);
                }}
                title={intl.get('common.ask')}
                okText={intl.get('common.ok')}
                cancelText={intl.get('common.cancel')}
              >
                <Button className="warning-btn" onClick={e => e.stopPropagation()}>
                  <Icon type="icon-btn-delete" />
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
    history.replace(`/schema/${space}/index/list/${e.target.value}`);
  };
  useEffect(() => {
    rebuildTimer.current && clearTimeout(rebuildTimer.current);
    module && setIndexType(module as IndexType);
    getData();
    return () => {
      rebuildTimer.current && clearTimeout(rebuildTimer.current);
    };
  }, [module, space]);
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
    columns={columns}
    renderExpandInfo={renderIndexInfo}
    onSearch={setSearchVal} >
    <div className="index-tab-header">
      <Radio.Group
        className="nebula-tab-group"
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
