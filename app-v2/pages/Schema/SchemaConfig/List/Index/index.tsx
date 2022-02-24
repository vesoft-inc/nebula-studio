import { Button, Popconfirm, Radio, Table, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Link, useHistory, useParams } from 'react-router-dom';
import Icon from '@appv2/components/Icon';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import { sortByFieldAndFilter } from '@appv2/utils/function';
import { IIndexList, IndexType } from '@appv2/interfaces/schema';
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
  const { schema: { indexList, deleteIndex, getIndexList } } = useStore();
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [indexType, setIndexType] = useState<any>(module as any || 'tag');
  const history = useHistory();
  const getData = async() => {
    setLoading(true);
    await getIndexList(indexType);
    setSearchVal('');
    setLoading(false);
  };
  const handleDeleteIndex = async(type: IndexType, name: string) => {
    const res = await deleteIndex({ type, name });
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      getData();
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
        if (index.name) {
          return (
            <div className="operation">
              <div>
                <Button className="primary-btn">
                  <Link
                    to={`/schema/${space}/index/edit/${index.name}`}
                    data-track-category="navigation"
                    data-track-action="view_index_edit"
                    data-track-label="from_index_list"
                  >
                    <Icon type="icon-btn-edit" />
                  </Link>
                </Button>
                <Popconfirm
                  onConfirm={() => {
                    handleDeleteIndex(indexType, index.name);
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
            </div>
          );
        }
      },
    },
  ], [indexType, Cookie.get('lang')]);

  const handleTabChange = e => {
    setIndexType(e.target.value);
    history.replace(`/schema/${space}/index/list/${e.target.value}`);
  };
  useEffect(() => {
    module && setIndexType(module as IndexType);
    getData();
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
