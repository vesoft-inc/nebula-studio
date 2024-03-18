import { Button, Popconfirm, Table, message, Popover, Form, Input, Dropdown, Tooltip, TableColumnType } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { observable } from 'mobx';
import { useI18n } from '@vesoft-inc/i18n';
import Icon from '@app/components/Icon';
import { trackPageView } from '@app/utils/stat';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { ISpace } from '@app/interfaces/schema';
import cls from 'classnames';
import { Link, useHistory } from 'react-router-dom';
import styles from './index.module.less';
import Search from './SchemaConfig/List/Search';
import DDLModal from './SchemaConfig/DDLModal';

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
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const onCloneClick = useCallback((e: React.MouseEvent) => {
    stopPropagation(e);
    setVisible(true);
  }, []);

  return (
    <Popover
      overlayClassName={styles.clonePopover}
      destroyTooltipOnHide
      open={visible}
      trigger="click"
      placement="left"
      onOpenChange={(visible) => setVisible(visible)}
      content={
        <div>
          <Form onFinish={handleClone} layout="inline">
            <Form.Item
              label={intl.get('schema.spaceName')}
              name="name"
              rules={[{ required: true, message: intl.get('formRules.nameRequired') }]}
            >
              <Input onClick={stopPropagation} />
            </Form.Item>
            <Form.Item>
              <Button htmlType="submit" type="primary">
                {intl.get('common.confirm')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      }
    >
      <Button type="link" onClick={onCloneClick}>
        {intl.get('schema.cloneSpace')}
      </Button>
    </Popover>
  );
};

const DangerButton = (props: { onConfirm: () => void; text: React.ReactNode }) => {
  const { text, onConfirm } = props;
  const [open, setOpen] = useState(false);
  const { intl } = useI18n();
  const domRef = useRef<HTMLElement>();

  const onClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <Popconfirm
      onConfirm={onConfirm}
      title={intl.get('common.ask')}
      okText={intl.get('common.ok')}
      cancelText={intl.get('common.cancel')}
      getPopupContainer={() => domRef.current}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="left"
    >
      <span ref={domRef} onClick={onClick}>
        <Button type="text" danger>
          {text}
        </Button>
      </span>
    </Popconfirm>
  );
};

const Schema = () => {
  const { schema, moduleConfiguration, global } = useStore();
  const { platform } = global;
  const state = useLocalObservable(
    () => {
      const initState = {
        loading: false,
        searchVal: '',
        spaces: [] as ISpace[],
        current: 1,
        pageSize: 10,
        ddlModal: {
          open: false,
          space: '',
        },
      };
      return {
        ...initState,
        setState(obj: Partial<typeof initState>) {
          Object.assign(this, obj);
        },
        get spacesFiltered(): ISpace[] {
          const { searchVal, spaces } = this;
          return searchVal ? spaces.filter((i) => i.Name.includes(searchVal)) : spaces;
        },
      };
    },
    { spaces: observable.ref },
  );
  const { loading, current, pageSize, spacesFiltered, ddlModal, setState } = state;
  const history = useHistory();
  const { intl } = useI18n();
  const { currentSpace, switchSpace, clearSpace, deleteSpace, cloneSpace, getSpaces, getSpaceInfo } = schema;
  const activeSpace = location.hash.slice(1);
  useEffect(() => {
    trackPageView('/schema');
    init();
  }, []);

  const handleDeleteSpace = async (name: string) => {
    const { setState, spaces, current, spacesFiltered } = state;
    setState({ loading: true });
    const res = await deleteSpace(name);
    setState({ loading: false });

    if (res.code !== 0) {
      return;
    }

    const nextSpaces = spaces.filter((s) => s.Name !== name);
    const nextState = { current, spaces: nextSpaces };
    if (spacesFiltered.at(-1)?.Name === name && spacesFiltered.length % pageSize === 1) {
      nextState.current = current > 1 ? current - 1 : current;
    }
    const spaces2Render = getSpaces2Render(nextState);
    await fillSpaces(spaces2Render);

    message.success(intl.get('common.deleteSuccess'));
    if (currentSpace === name) {
      schema.update({ currentSpace: '' });
      localStorage.removeItem('currentSpace');
    }

    setState(nextState);
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
    if (code !== 0) {
      setState({ loading: false });
      return;
    }

    const spaceNames: string[] = data?.sort() || [];
    const activeSpace = location.hash.slice(1);
    if (activeSpace) {
      const index = spaceNames.indexOf(activeSpace);
      if (index > -1) {
        spaceNames.splice(index, 1);
        spaceNames.unshift(activeSpace);
      }
    }
    const spaces: ISpace[] = spaceNames.map((Name) => ({ Name }));
    const nextState = { spaces, current: 1, searchVal: '' };
    const spaces2Render = getSpaces2Render(nextState);
    await fillSpaces(spaces2Render);
    setState({ ...nextState, loading: false });
  }, []);

  const fillSpaces = useCallback(async (spaces: ISpace[]) => {
    setState({ loading: true });
    await Promise.all(
      spaces.map(
        (s) =>
          !s.ID &&
          getSpaceInfo(s.Name).then((res) => {
            res.code === 0 && Object.assign(s, res?.data?.tables?.[0]);
          }),
      ),
    );
    setState({ loading: false });
    return spaces;
  }, []);

  const onSearch = useCallback(async (searchVal: string) => {
    const spaces2Render = getSpaces2Render({ searchVal, current: 1 });
    await fillSpaces(spaces2Render);
    state.setState({ searchVal, current: 1 });
  }, []);

  const onPageChange = useCallback(async (current: number) => {
    const spaces2Render = getSpaces2Render({ current });
    await fillSpaces(spaces2Render);
    state.setState({ current });
  }, []);

  const getSpaces2Render = useCallback((params?: Partial<typeof state>) => {
    const {
      searchVal: _searchVal = state.searchVal,
      current: _current = state.current,
      pageSize: _pageSize = state.pageSize,
      spaces: _spaces = state.spaces,
    } = params || {};
    const nextSpaces = _searchVal ? _spaces.filter((i) => i.Name.includes(_searchVal)) : _spaces;
    const spaceList = nextSpaces.slice((_current - 1) * _pageSize, _current * _pageSize);
    return spaceList;
  }, []);

  const handleCloneSpace = useCallback(async (name: string, oldSpace: string) => {
    const { code } = await cloneSpace(name, oldSpace);
    if (code === 0) {
      message.success(intl.get('schema.createSuccess'));
      init();
    }
  }, []);

  const closeDDLModal = useCallback(() => setState({ ddlModal: { open: false, space: '' } }), []);
  const columns: TableColumnType<ISpace>[] = [
    {
      title: intl.get('schema.No'),
      dataIndex: 'index',
      align: 'center',
      render: (_value, _record, index) => (current - 1) * pageSize + index + 1,
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
        if (!space.ID) {
          return null;
        }
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
              destroyPopupOnHide
              menu={{
                items: [
                  {
                    key: 'ddl',
                    label: (
                      <Button type="link" onClick={() => setState({ ddlModal: { open: true, space: space.Name } })}>
                        {intl.get('schema.showDDL')}
                      </Button>
                    ),
                  },
                  ...(
                    platform !== 'cloud' ? [
                      {
                        key: 'clone',
                        label: <CloneSpacePopover space={space.Name} onClone={handleCloneSpace} />,
                      },
                      {
                        key: 'clear',
                        label: (
                          <DangerButton
                            onConfirm={() => handleClearSpace(space.Name)}
                            text={intl.get('schema.clearSpace')}
                          />
                        ),
                      },
                      {
                        key: 'delete',
                        label: (
                          <DangerButton
                            onConfirm={() => handleDeleteSpace(space.Name)}
                            text={intl.get('schema.deleteSpace')}
                          />
                        ),
                      },
                    ] : []
                  )
                ],
              }}
              placement="bottomRight"
            >
              <Icon className={styles.btnMore} type="icon-studio-more" />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  const spaces2Render = spacesFiltered.slice((current - 1) * pageSize, current * pageSize);

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
          dataSource={spaces2Render}
          columns={columns}
          loading={!!loading}
          rowKey="ID"
          rowClassName={(item) => (item.Name === activeSpace ? styles.active : '')}
          pagination={{
            current,
            pageSize,
            total: spacesFiltered.length,
            onChange: onPageChange,
          }}
        />
      </div>
      <DDLModal {...ddlModal} onCancel={closeDDLModal} />
    </div>
  );
};

export default observer(Schema);
