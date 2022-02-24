import { Button, Popconfirm, Table, message } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import { trackPageView } from '@app/utils/stat';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import './index.less';
import { Link, useHistory } from 'react-router-dom';

const Schema = () => {
  const { schema } = useStore();
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { currentSpace, switchSpace, getSpacesList, deleteSpace, spaceList } = schema;
  useEffect(() => {
    trackPageView('/schema');
    getSpaces();
  }, []);

  const handleDeleteSpace = async(name: string) => {
    setLoading(true);
    const res = await deleteSpace(name);
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      await getSpaces();
      if (currentSpace === name) {
        schema.update({
          currentSpace: ''
        });
      }
    }
  };

  const handleSwitchSpace = async(space: string) => {
    const err = await switchSpace(space);
    if (!err) {
      history.push(`/schema/${space}/tag/list`);
    } else if (err && err.toLowerCase().includes('spacenotfound')) {
      message.warning(intl.get('_schema.useSpaceErrTip'));
    }
  };
  const getSpaces = async() => {
    setLoading(true);
    await getSpacesList();
    setLoading(false);
  };
  const columns = [
    {
      title: intl.get('_schema.No'),
      dataIndex: 'serialNumber',
      align: 'center' as const,
    },
    {
      title: intl.get('_schema.spaceName'),
      dataIndex: 'Name',
      render: value => (
        <Button
          className="cell-btn"
          type="link"
          onClick={() => handleSwitchSpace(value)}
          data-track-category="navigation"
          data-track-action="view_space_list"
          data-track-label="from_space_list"
        >
          {value}
        </Button>
      ),
    },
    {
      title: intl.get('_schema.partitionNumber'),
      dataIndex: 'Partition Number',
    },
    {
      title: intl.get('_schema.replicaFactor'),
      dataIndex: 'Replica Factor',
    },
    {
      title: intl.get('_schema.charset'),
      dataIndex: 'Charset',
    },
    {
      title: intl.get('_schema.collate'),
      dataIndex: 'Collate',
    },
    {
      title: intl.get('_schema.vidType'),
      dataIndex: 'Vid Type',
    },
    {
      title: intl.get('_schema.atomicEdge'),
      dataIndex: 'Atomic Edge',
      render: value => String(value),
    },
    {
      title: intl.get('_schema.group'),
      dataIndex: 'Group',
    },
    {
      title: intl.get('_schema.comment'),
      dataIndex: 'Comment',
    },
    {
      title: intl.get('_schema.operations'),
      dataIndex: 'operation',
      render: (_, space) => {
        if (space.ID) {
          return (
            <div className="operation">
              <Button
                className="primary-btn"
                onClick={() => handleSwitchSpace(space.Name)}
                data-track-category="navigation"
                data-track-action="view_space_list"
                data-track-label="from_space_list"
              >
                {intl.get('common.schema')}
              </Button>
              <Popconfirm
                onConfirm={() => handleDeleteSpace(space.Name)}
                title={intl.get('common.ask')}
                okText={intl.get('common.ok')}
                cancelText={intl.get('common.cancel')}
              >
                <Button className="warning-btn">
                  <Icon type="icon-btn-delete" />
                </Button>
              </Popconfirm>
            </div>
          );
        }
      },
    },
  ];
  return <div className="schema-page center-layout">
    <div className="schema-header">
      {intl.get('_schema.spaceList')}
    </div>
    <div className="schema-container">
      <Button className="studio-add-btn btn-create" type="primary">
        <Link
          to="/schema/space/create"
          data-track-category="navigation"
          data-track-action="view_space_create"
          data-track-label="from_space_list"
        >
          <Icon className="studio-add-btn-icon" type="icon-btn-add" />{intl.get('_schema.createSpace')}
        </Link>
      </Button>
      <Table
        className="table-space-list"
        dataSource={spaceList}
        columns={columns}
        loading={!!loading}
        rowKey="ID"
      />
    </div>
  </div>;
};

export default observer(Schema);
