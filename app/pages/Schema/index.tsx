import { Button, Popconfirm, Table, message, Popover, Form, Input, Dropdown, Menu, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import { trackPageView } from '@app/utils/stat';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { NebulaVersion } from '@app/stores/types.d.ts';
import './index.less';
import { Link, useHistory } from 'react-router-dom';

interface IOperations {
  space: string;
  onClone: (name: string, oldSpace: string) => void
  onDelete: (name: string) => void;
  version: NebulaVersion
}

const Operations = (props: IOperations) => {
  const { space, onClone, onDelete, version } = props;
  const [visible, setVisible] = useState(false);
  const handleClone = (values) => {
    const { name } = values;
    onClone(name, space);
    setVisible(false);
  };
  return <Menu className="operations-space">
    <Menu.Item key="delete">
      <Popconfirm
        onConfirm={() => onDelete(space)}
        title={intl.get('common.ask')}
        okText={intl.get('common.ok')}
        cancelText={intl.get('common.cancel')}
      >
        <Button type="link" danger>
          {intl.get('schema.deleteSpace')}
        </Button>
      </Popconfirm>
    </Menu.Item>
    {version !== NebulaVersion.V2_5 && <Menu.Item key="clone">
      <Popover
        destroyTooltipOnHide={true}
        placement="leftTop"
        visible={visible}
        trigger="click"
        onVisibleChange={visible => setVisible(visible)}
        content={<Form onFinish={handleClone} layout="inline">
          <Form.Item label={intl.get('schema.spaceName')} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              {intl.get('common.confirm')}
            </Button>
          </Form.Item>
        </Form>}
      >
        <Button type="link" onClick={() => setVisible(true)}>
          {intl.get('schema.cloneSpace')}
        </Button>
      </Popover>
    </Menu.Item>}
  </Menu>;
};

const Schema = () => {
  const { schema, global } = useStore();
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { nebulaVersion } = global;
  const { currentSpace, switchSpace, getSpacesList, deleteSpace, spaceList, cloneSpace } = schema;
  useEffect(() => {
    trackPageView('/schema');
    getSpaces();
  }, []);

  const handleDeleteSpace = async (name: string) => {
    setLoading(true);
    const res = await deleteSpace(name);
    setLoading(false);
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      await getSpaces();
      if (currentSpace === name) {
        schema.update({
          currentSpace: ''
        });
        sessionStorage.removeItem('currentSpace');
      }
    }
  };

  const handleSwitchSpace = async (space: string) => {
    const err = await switchSpace(space);
    if (!err) {
      history.push(`/schema/tag/list`);
    } else if (err && err.toLowerCase().includes('spacenotfound')) {
      message.warning(intl.get('schema.useSpaceErrTip'));
    }
  };
  const getSpaces = async () => {
    setLoading(true);
    await getSpacesList();
    setLoading(false);
  };

  const handleCloneSpace = async (name: string, oldSpace: string) => {
    const { code } = await cloneSpace(name, oldSpace);
    if(code === 0) {
      message.success(intl.get('schema.createSuccess'));
      getSpaces();
    }
  };
  const columns = [
    {
      title: intl.get('schema.No'),
      dataIndex: 'serialNumber',
      align: 'center' as const,
    },
    {
      title: intl.get('schema.spaceName'),
      dataIndex: 'Name',
      ellipsis: {
        showTitle: false,
      },
      render: data => (
        <Tooltip placement="topLeft" title={data}>
          <Button
            className="cell-btn"
            type="link"
            onClick={() => handleSwitchSpace(data)}
            data-track-category="navigation"
            data-track-action="view_space_list"
            data-track-label="from_space_list"
          >
            {data}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: intl.get('schema.partitionNumber'),
      dataIndex: 'Partition Number',
    },
    {
      title: intl.get('schema.replicaFactor'),
      dataIndex: 'Replica Factor',
    },
    {
      title: intl.get('schema.charset'),
      dataIndex: 'Charset',
    },
    {
      title: intl.get('schema.collate'),
      dataIndex: 'Collate',
    },
    {
      title: intl.get('schema.vidType'),
      dataIndex: 'Vid Type',
    },
    {
      title: intl.get('schema.atomicEdge'),
      dataIndex: 'Atomic Edge',
      render: value => String(value),
    },
    {
      title: intl.get('schema.group'),
      dataIndex: 'Group',
    },
    {
      title: intl.get('schema.comment'),
      dataIndex: 'Comment',
      ellipsis: {
        showTitle: false,
      },
      render: data => (
        <Tooltip placement="topLeft" title={data}>
          {data}
        </Tooltip>
      ),
    },
    {
      title: intl.get('schema.operations'),
      dataIndex: 'operation',
      width: 180,
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
              <Dropdown overlay={<Operations version={nebulaVersion} space={space.Name} onDelete={handleDeleteSpace} onClone={handleCloneSpace} />} placement="bottomLeft">
                <Icon className="btn-more" type="icon-studio-more" />
              </Dropdown>
            </div>
          );
        }
      },
    },
  ];
  return <div className="schema-page center-layout">
    <div className="schema-header">
      {intl.get('schema.spaceList')}
    </div>
    <div className="schema-container">
      <Button className="studio-add-btn btn-create" type="primary">
        <Link
          to="/schema/space/create"
          data-track-category="navigation"
          data-track-action="view_space_create"
          data-track-label="from_space_list"
        >
          <Icon className="studio-add-btn-icon" type="icon-studio-btn-add" />{intl.get('schema.createSpace')}
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
