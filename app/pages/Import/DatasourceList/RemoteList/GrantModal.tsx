import { IDatasourceItem } from '@app/interfaces/datasource';
import { useStore } from '@app/stores';
import service from '@app/config/service';
import { Button, message, Modal, Select, Table } from 'antd';
import { useI18n } from '@vesoft-inc/i18n';
import { useEffect, useMemo, useState } from 'react';

interface IProps {
  visible: boolean;
  datasource: IDatasourceItem;
  onCancel: () => void;
  onSuccess: () => void;
}

const GrantModal: React.FC<IProps> = (props) => {
  const { visible, datasource, onCancel, onSuccess } = props;
  const { intl } = useI18n();
  const { datasource: datasourceStore, global } = useStore();
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [usersLoadFailed, setUsersLoadFailed] = useState(false);
  const [originalGrantedUsers, setOriginalGrantedUsers] = useState<string[]>([]);
  const [grantedUsers, setGrantedUsers] = useState<string[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  const currentUser = global.username;
  const creator = datasource?.creator;

  const addableUsers = useMemo(
    () =>
      allUsers.filter(
        (username) => username && username !== 'root' && username !== currentUser && !grantedUsers.includes(username),
      ),
    [allUsers, currentUser, grantedUsers],
  );

  const refreshData = async () => {
    if (!datasource?.id) {
      return;
    }
    setLoading(true);
    setUsersLoading(true);
    try {
      const [grants, usersRes] = await Promise.all([
        datasourceStore.getDatasourceGrants(datasource.id),
        service.execNGQL({ gql: 'SHOW USERS;' }, { noTip: true }) as Promise<any>,
      ]);
      const granted = grants.map((item) => item.username).filter(Boolean).sort();
      const users = (usersRes?.data?.tables || [])
        .map((item) => item.Account)
        .filter(Boolean)
        .sort();
      setUsersLoadFailed(usersRes?.code !== 0);
      setOriginalGrantedUsers(granted);
      setGrantedUsers(granted);
      setAllUsers(users);
      setSelectedToAdd([]);
      if (usersRes?.code !== 0) {
        message.warning(intl.get('import.datasourceUsersLoadFailed'));
      }
    } finally {
      setLoading(false);
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    visible && refreshData();
  }, [visible, datasource?.id]);

  const handleAdd = () => {
    if (!selectedToAdd.length) {
      return;
    }
    setGrantedUsers((prev) => [...prev, ...selectedToAdd].filter((v, i, arr) => arr.indexOf(v) === i).sort());
    setSelectedToAdd([]);
  };

  const handleRemove = (username: string) => {
    setGrantedUsers((prev) => prev.filter((item) => item !== username));
  };

  const handleSave = async () => {
    const toAdd = grantedUsers.filter((username) => !originalGrantedUsers.includes(username));
    const toRemove = originalGrantedUsers.filter((username) => !grantedUsers.includes(username));
    setLoading(true);
    try {
      if (toAdd.length) {
        const ok = await datasourceStore.addDatasourceGrants(datasource.id, toAdd);
        if (!ok) {
          return;
        }
      }
      if (toRemove.length) {
        const ok = await datasourceStore.removeDatasourceGrants(datasource.id, toRemove);
        if (!ok) {
          return;
        }
      }
      message.success(intl.get('common.updateSuccess'));
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.get('import.datasourceGrantManage', { name: datasource?.name || '' })}
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={loading}
      okText={intl.get('common.confirm')}
      cancelText={intl.get('common.cancel')}
      width={640}
    >
      <div style={{ marginBottom: 12 }}>
        {intl.get('import.datasourceGrantTips', { creator: creator || '-' })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Select
          mode={usersLoadFailed ? 'tags' : 'multiple'}
          style={{ flex: 1 }}
          loading={usersLoading}
          value={selectedToAdd}
          onChange={(values) => setSelectedToAdd(values)}
          options={addableUsers.map((username) => ({ value: username, label: username }))}
          placeholder={intl.get('import.selectGrantUsers')}
          optionFilterProp='label'
          showSearch
        />
        <Button onClick={handleAdd} disabled={!selectedToAdd.length}>
          {intl.get('common.add')}
        </Button>
      </div>

      <Table
        rowKey={(record) => record.username}
        loading={loading}
        pagination={false}
        dataSource={grantedUsers.map((username) => ({ username }))}
        locale={{ emptyText: intl.get('import.noDatasourceGrantUsers') }}
        columns={[
          {
            title: intl.get('import.account'),
            dataIndex: 'username',
          },
          {
            title: intl.get('common.operation'),
            width: 120,
            render: (_, row: { username: string }) => (
              <Button type='link' danger onClick={() => handleRemove(row.username)}>
                {intl.get('common.delete')}
              </Button>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default GrantModal;
