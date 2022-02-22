import { Button, Popconfirm, Table, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Link, useParams } from 'react-router-dom';
import { DeleteTwoTone, FormOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import { sortByFieldAndFilter } from '@appv2/utils/function';
import { ITag } from '@appv2/interfaces/schema';
import SchemaListLayout from '../SchemaListLayout';

function renderTagInfo(tag: ITag) {
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
        {tag.name} {intl.get('common.relatedProperties')}:
      </p>
      <Table
        columns={fieldsColumn}
        dataSource={tag.fields}
        rowKey="Field"
        pagination={false}
      />
    </div>
  );
}

const TagList = () => {
  const { space } = useParams() as {space :string, type: string};
  const { schema: { tagList, deleteTag, getTagList } } = useStore();
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const getData = async() => {
    setLoading(true);
    await getTagList();
    setSearchVal('');
    setLoading(false);
  };
  const handleDeleteTag = async(name: string) => {
    const res = await deleteTag(name);
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
      render: (_, tag) => tag.fields?.length || 0
    },
    {
      title: intl.get('common.operation'),
      dataIndex: 'operation',
      render: (_, tag) => {
        if (!tag.name) {
          return null;
        }
        return (
          <div className="operation">
            <div>
              <Button className="primary-btn">
                <Link
                  to={`/schema/${space}/tag/edit/${tag.name}`}
                  data-track-category="navigation"
                  data-track-action="view_tag_edit"
                  data-track-label="from_tag_list"
                >
                  <FormOutlined className="edit-btn" />
                </Link>
              </Button>
              <Popconfirm
                onConfirm={() => {
                  handleDeleteTag(tag.name);
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
      },
    },
  ], [tagList]);

  useEffect(() => {
    getData();
  }, [space]);
  useEffect(() => {
    setData(sortByFieldAndFilter({
      field: 'name',
      searchVal,
      list: tagList,
    }));
  }, [tagList, searchVal]);

  return <SchemaListLayout 
    loading={loading}
    data={data}
    columns={columns}
    renderExpandInfo={renderTagInfo}
    onSearch={setSearchVal} />;
};

export default observer(TagList);
