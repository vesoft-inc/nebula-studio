import { Button, Popconfirm, Table, message, Popover, Form, Input, Dropdown, Tooltip } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { observable } from 'mobx';
import { useI18n } from '@vesoft-inc/i18n';
import Icon from '@app/components/Icon';
import { trackPageView } from '@app/utils/stat';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import cls from 'classnames';
import { Link, useHistory } from 'react-router-dom';
import styles from './index.module.less';
import Search from './SchemaConfig/List/Search';
import DDLButton from './SchemaConfig/DDLButton';

interface ICloneOperations {
  space: string;
  onClone: (name: string, oldSpace: string) => void;
}

const CloneSpacePopover = (props: ICloneOperations) => {
  const { space, onClone } = props;
  const [visible, setVisible] = useState(false);
  const { intl } = useI18n();
  const handleClone = (values) => {
    const { name } = values;
    onClone(name, space);
    setVisible(false);
  };
  return (
    <Popover
      overlayClassName={styles.clonePopover}
      destroyTooltipOnHide={true}
      placement="leftTop"
      open={visible}
      trigger="click"
      onOpenChange={(visible) => setVisible(visible)}
      content={
        <Form onFinish={handleClone} layout="inline">
          <Form.Item
            label={intl.get('schema.spaceName')}
            name="name"
            rules={[{ required: true, message: intl.get('formRules.nameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              {intl.get('common.confirm')}
            </Button>
          </Form.Item>
        </Form>
      }
    >
      <Button type="link" onClick={() => setVisible(true)}>
        {intl.get('schema.cloneSpace')}
      </Button>
    </Popover>
  );
};

const Schema = () => {
  const { schema, moduleConfiguration } = useStore();
  const state = useLocalObservable(
    () => ({
      loading: false,
      searchVal: '',
      spaces: [],
      data: [],
      current: 1,
      pageSize: 10,
      total: 0,
      setState: (obj) => Object.assign(state, obj),
    }),
    { data: observable.ref, spaces: observable.ref },
  );
  const { loading, data, current, pageSize, total } = state;
  const history = useHistory();
  const { intl } = useI18n();
  const { currentSpace, switchSpace, clearSpace, getSpacesList, deleteSpace, cloneSpace, getSpaces } = schema;
  const activeSpace = location.hash.slice(1);
  useEffect(() => {
    trackPageView('/schema');
    init();
  }, []);

  const handleDeleteSpace = async (name: string) => {
    const { setState, spaces } = state;
    setState({ loading: true });
    const res = await deleteSpace(name);
    setState({ loading: false });
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      const _spaces = spaces.splice(spaces.indexOf(name), 1);
      await getData({ spaces: _spaces });
      if (currentSpace === name) {
        schema.update({
          currentSpace: '',
        });
        localStorage.removeItem('currentSpace');
      }
    }
  };
  const handleClearSpace = async (name: string) => {
    const { setState } = state;
    setState({ loading: true });
    const res = await clearSpace(name);
    setState({ loading: false });
    if (res.code === 0) {
      message.success(intl.get('common.success'));
    }
  };

  const viewSpaceDetail = useCallback(async (space: string) => {
    const ok = await switchSpace(space);
    ok && history.push(`/schema/tag/list`);
  }, []);
  const init = useCallback(async () => {
    const { setState } = state;
    setState({ loading: true });
    const { code, data } = await getSpaces();
    const sortData = data.sort();
    if (code === 0) {
      const activeSpace = location.hash.slice(1);
      if (activeSpace) {
        const index = sortData.indexOf(activeSpace);
        if (index > -1) {
          sortData.splice(index, 1);
          sortData.unshift(activeSpace);
        }
      }
      setState({
        spaces: data,
        loading: false,
        current: 1,
        pageSize: 10,
        total: data.length,
      });
      await getData({ spaces: data, current: 1 });
    }
    setState({ loading: false });
  }, []);
  const getData = async (params?: Partial<typeof state>) => {
    const { setState } = state;
    setState({ loading: true });
    const {
      searchVal: _searchVal = state.searchVal,
      current: _current = state.current,
      pageSize: _pageSize = state.pageSize,
      spaces: _spaces = state.spaces,
    } = params || {};
    const spaceList = _spaces
      .filter((i) => i.includes(_searchVal))
      .slice((_current - 1) * _pageSize, _current * _pageSize);
    const data = await getSpacesList(spaceList);
    data.map((item, index) => {
      item.serialNumber = (_current - 1) * _pageSize + index + 1;
      return item;
    });
    setState({
      data,
      loading: false,
      ...params,
    });
  };
  const onSearch = useCallback((value) => getData({ searchVal: value, current: 1 }), []);

  const handleCloneSpace = useCallback(async (name: string, oldSpace: string) => {
    const { code } = await cloneSpace(name, oldSpace);
    if (code === 0) {
      message.success(intl.get('schema.createSuccess'));
      getSpaces();
    }
  }, []);
  const columns = [
    {
      title: intl.get('schema.No'),
      dataIndex: 'serialNumber',
      align: 'center' as const,
    },
    {
      title: intl.get('schema.spaceName'),
      dataIndex: 'Name',
      width: 150,
      ellipsis: {
        showTitle: false,
      },
      render: (data) => (
        <Tooltip placement="topLeft" title={data}>
          <a
            className={styles.cellBtn}
            type="link"
            onClick={() => viewSpaceDetail(data)}
            data-track-category="navigation"
            data-track-action="view_space_list"
            data-track-label="from_space_list"
          >
            {data}
          </a>
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
      title: intl.get('schema.group'),
      dataIndex: 'Group',
    },
    {
      title: intl.get('schema.comment'),
      dataIndex: 'Comment',
      ellipsis: {
        showTitle: false,
      },
      render: (data) => (
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
            <div className={styles.operation}>
              <Button
                className="primaryBtn"
                onClick={() => viewSpaceDetail(space.Name)}
                data-track-category="navigation"
                data-track-action="view_space_list"
                data-track-label="from_space_list"
              >
                {intl.get('common.schema')}
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'ddl',
                      label: <DDLButton space={space.Name} />,
                    },
                    {
                      key: 'clone',
                      label: <CloneSpacePopover space={space.Name} onClone={handleCloneSpace} />,
                    },
                    {
                      key: 'clear',
                      label: (
                        <Popconfirm
                          onConfirm={() => handleClearSpace(space.Name)}
                          title={intl.get('common.ask')}
                          okText={intl.get('common.ok')}
                          cancelText={intl.get('common.cancel')}
                        >
                          <Button type="link" danger>
                            {intl.get('schema.clearSpace')}
                          </Button>
                        </Popconfirm>
                      ),
                    },
                    {
                      key: 'delete',
                      label: (
                        <Popconfirm
                          onConfirm={() => handleDeleteSpace(space.Name)}
                          title={intl.get('common.ask')}
                          okText={intl.get('common.ok')}
                          cancelText={intl.get('common.cancel')}
                        >
                          <Button type="link" danger>
                            {intl.get('schema.deleteSpace')}
                          </Button>
                        </Popconfirm>
                      ),
                    },
                  ],
                }}
                placement="bottomLeft"
              >
                <Icon className={styles.btnMore} type="icon-studio-more" />
              </Dropdown>
            </div>
          );
        }
      },
    },
  ];
  return (
    <div className={cls(styles.schemaPage, 'studioCenterLayout')}>
      <div className={styles.schemaHeader}>{intl.get('schema.spaceList')}</div>
      <div className={styles.schemaContainer}>
        <div className={styles.row}>
          <Search type={intl.get('common.space')} onSearch={onSearch} />
          {!moduleConfiguration.schema?.disableCreateSpace && (
            <Button className={cls(styles.btnCreate, 'studioAddBtn')} type="primary">
              <Link
                to="/schema/space/create"
                data-track-category="navigation"
                data-track-action="view_space_create"
                data-track-label="from_space_list"
              >
                <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
                {intl.get('schema.createSpace')}
              </Link>
            </Button>
          )}
        </div>
        <Table
          className={styles.tableSpaceList}
          dataSource={data}
          columns={columns}
          loading={!!loading}
          rowKey="ID"
          rowClassName={(item) => (item.Name === activeSpace ? styles.active : '')}
          pagination={{
            current,
            pageSize,
            total,
            onChange: (current, pageSize) => getData({ current, pageSize }),
          }}
        />
      </div>
    </div>
  );
};

export default observer(Schema);