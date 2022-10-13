import { Button, Popconfirm, Table, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import Icon from '@app/components/Icon';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { sortByFieldAndFilter } from '@app/utils/function';
import { ITag } from '@app/interfaces/schema';
import Cookie from 'js-cookie';
import CommonLayout from '../CommonLayout';
import styles from '../CommonLayout/index.module.less';

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
      <p>
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
  const { schema: { tagList, deleteTag, getTagList, currentSpace } } = useStore();
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const getData = async () => {
    setLoading(true);
    await getTagList();
    setSearchVal('');
    setLoading(false);
  };
  const handleDeleteTag = async (name: string) => {
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
      title: intl.get('schema.propertyCount'),
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
          <div className={styles.operation}>
            <Button type="link" className="primaryBtn">
              <Link
                to={{
                  pathname: '/schema/tag/edit',
                  state: { tag: tag.name },
                }}
                data-track-category="navigation"
                data-track-action="view_tag_edit"
                data-track-label="from_tag_list"
              >
                <Icon type="icon-studio-btn-edit" />
              </Link>
            </Button>
            <Popconfirm
              onConfirm={(e) => {
                e.stopPropagation();
                handleDeleteTag(tag.name);
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
      },
    },
  ], [tagList, Cookie.get('lang')]);

  useEffect(() => {
    getData();
  }, [currentSpace]);
  useEffect(() => {
    setData(sortByFieldAndFilter({
      field: 'name',
      searchVal,
      list: tagList,
    }));
  }, [tagList, searchVal]);

  return <CommonLayout 
    type="tag"
    loading={loading}
    data={data}
    columns={columns}
    renderExpandInfo={renderTagInfo}
    onSearch={setSearchVal} />;
};

export default observer(TagList);
