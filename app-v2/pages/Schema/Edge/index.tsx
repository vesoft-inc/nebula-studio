import { Button, Popconfirm, Table, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Link, useParams } from 'react-router-dom';
import { DeleteTwoTone, FormOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import { sortByFieldAndFilter } from '@appv2/utils/function';
import { IEdge } from '@appv2/interfaces/schema';
import SchemaListLayout from '../SchemaListLayout';

function renderEdgeInfo(edge: IEdge) {
  const fieldsColumn = [
    {
      title: intl.get('common.propertyName'),
      dataIndex: 'Field',
    },
    {
      title: intl.get('common.dataType'),
      dataIndex: 'Type',
    },
    {
      title: intl.get('common.defaults'),
      dataIndex: 'Default',
    },
    {
      title: intl.get('common.comment'),
      dataIndex: 'Comment',
    },
  ];
  return (
    <div>
      <p className="table-inner-title">
        {edge.name} {intl.get('common.relatedProperties')}:
      </p>
      <Table
        columns={fieldsColumn}
        dataSource={edge.fields}
        rowKey="Field"
        pagination={false}
      />
    </div>
  );
}

const EdgeList = () => {
  const { space } = useParams() as {space :string, type: string};
  const { schema: { edgeList, deleteEdge, getEdgeList } } = useStore();
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const getData = async() => {
    setLoading(true);
    await getEdgeList();
    setSearchVal('');
    setLoading(false);
  };
  const handleDeleteEdge = async(name: string) => {
    const res = await deleteEdge(name);
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      await getData();
    }
  };
  const columns = useMemo(() => [
    {
      title: intl.get('common.name'),
      dataIndex: 'name',
      width: '33%',
    },
    {
      title: intl.get('_schema.propertyCount'),
      dataIndex: 'count',
      width: '33%',
      render: (_, edge) => edge.fields?.length || 0
    },
    {
      title: intl.get('common.operation'),
      dataIndex: 'operation',
      render: (_, edge) => {
        if (edge.name) {
          return (
            <div className="operation">
              <div>
                <Button className="primary-btn">
                  <Link
                    to={`/schema/${space}/edge/edit/${edge.name}`}
                    data-track-category="navigation"
                    data-track-action="view_edge_edit"
                    data-track-label="from_edge_list"
                  >
                    <FormOutlined className="edit-btn" />
                  </Link>
                </Button>
                <Popconfirm
                  onConfirm={() => {
                    handleDeleteEdge(edge.name);
                  }}
                  title={intl.get('common.ask')}
                  okText={intl.get('common.ok')}
                  cancelText={intl.get('common.cancel')}
                >
                  <Button className="warning-btn" onClick={e => e.stopPropagation()}>
                    <DeleteTwoTone
                      twoToneColor="#CF1322"
                    />
                  </Button>
                </Popconfirm>
              </div>
            </div>
          );
        }
      },
    },
  ], [edgeList]);
  useEffect(() => {
    getData();
  }, [space]);
  useEffect(() => {
    setData(sortByFieldAndFilter({
      field: 'name',
      searchVal,
      list: edgeList,
    }));
  }, [edgeList, searchVal]);
  return <SchemaListLayout 
    loading={loading}
    data={data}
    columns={columns}
    renderExpandInfo={renderEdgeInfo}
    onSearch={setSearchVal} />;
};

export default observer(EdgeList);