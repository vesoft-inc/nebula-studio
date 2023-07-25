import { ArrowLeftOutlined, FileTextFilled, FolderFilled, SyncOutlined } from '@ant-design/icons';
import { IDatasourceType, IS3Platform } from '@app/interfaces/datasource';
import { useStore } from '@app/stores';
import { ICachedStore } from '@app/stores/datasource';
import { useBatchState } from '@app/utils';
import { getFileSize } from '@app/utils/file';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Select, Spin, Tooltip } from 'antd';
import cls from 'classnames';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';
import styles from './index.module.less';
const Option = Select.Option;
interface IFileSelect {
  onConfirm: (file, cachedState) => void;
  cachedState?: ICachedStore;
}
const FileSelect = observer((props: IFileSelect) => {
  const { intl } = useI18n();
  const { datasource, files } = useStore();
  const { onConfirm, cachedState } = props;
  const { getDatasourceList, getDatasourceDetail, previewFile } = datasource;
  const { getFiles } = files;
  const { state, setState } = useBatchState({
    loading: false,
    options: [],
    directory: cachedState?.directory || [],
    path: cachedState?.path || '',
    activeId: cachedState?.activeId,
    activeItem: cachedState?.activeItem,
  } as ICachedStore);
  const { options, directory, path, activeItem, activeId, loading } = state;
  const init = useCallback(async () => {
    setState({ loading: true });
    const data = await getDatasourceList();
    setState({
      options: data,
      loading: false,
    });
  }, []);

  const getLocalFiles = useCallback(async () => {
    const files = await getFiles();
    setState({
      directory: files,
      path: '/',
      loading: false,
      activeId: IDatasourceType.Local,
    });
  }, []);
  const getDatasourceDirectory = useCallback(async (id, path?) => {
    const data = await getDatasourceDetail({ id, path });
    setState({
      directory: data,
      activeId: id,
      path: path || '/',
      loading: false,
    });
  }, []);

  useEffect(() => {
    init();
  }, []);
  const handleSelectFile = useCallback(
    async (item) => {
      if (item.type !== 'directory') return;
      setState({ loading: true });
      const newPath = `${path === '/' ? '' : path}${item.name}${item.type === 'directory' ? '/' : ''}`;
      getDatasourceDirectory(activeId, newPath);
    },
    [path],
  );

  const handlePathBack = useCallback(async () => {
    if (!path || path === '/') return;
    setState({ loading: true });
    /**
     * - `/a/b/c/?` => `/a/b/`
     * - `a/b/?` => `a`
     * - `a/?` => ``
     */
    const parentPath = path.replace(/(\/|^)[^/]+\/?$/, '$1');
    getDatasourceDirectory(activeId, parentPath);
  }, [path, activeId]);
  const handleTypeChange = useCallback(async (value) => {
    setState({
      loading: true,
      activeId: null,
      activeItem: null,
      path: '',
    });
    if (value === IDatasourceType.Local) {
      getLocalFiles();
    } else {
      getDatasourceDirectory(value);
    }
  }, []);
  const handleRefresh = useCallback(async () => {
    if (!activeId) return;
    setState({ loading: true });
    if (activeId === IDatasourceType.Local) {
      getLocalFiles();
      return;
    }
    const _path = !path || path === '/' ? '' : path;
    getDatasourceDirectory(activeId, _path);
  }, [activeId, path]);
  const handleConfirm = useCallback(async () => {
    if (activeItem && activeId === IDatasourceType.Local) {
      // select local file
      onConfirm(activeItem, state);
      return;
    }
    setState({ loading: true });
    const _path = `${path === '/' ? '' : path}${activeItem.name}`;
    const data = await previewFile({ id: activeId, path: _path });
    const item = {
      name: activeItem.name,
      withHeader: false,
      delimiter: ',',
      sample: data.contents.join('\r\n'),
      path: _path,
      datasourceId: activeId === IDatasourceType.Local ? null : activeId,
    } as any;
    setState({ loading: false });
    onConfirm(item, state);
  }, [activeItem, activeId, path]);
  return (
    <Spin spinning={loading}>
      <div className={styles.row}>
        <span className={styles.label}>{intl.get('import.datasourceType')}</span>
        <Select
          className={styles.typeSelect}
          onChange={handleTypeChange}
          popupClassName={styles.typeOptions}
          optionLabelProp="label"
          defaultValue={activeId}
          popupMatchSelectWidth={false}
        >
          <Option value={IDatasourceType.Local}>{intl.get('import.localFiles')}</Option>
          {options.map((item) => {
            let label = '';
            let platform = '';
            if (item.type === IDatasourceType.S3) {
              label = item.s3Config.bucket;
              platform = item.platform !== IS3Platform.Customize ? item.platform.toUpperCase() : intl.get('import.s3');
            } else {
              label = item.sftpConfig.host + ':' + item.sftpConfig.port;
              platform = intl.get('import.sftp');
            }
            return (
              <Option value={item.id} key={item.id} label={label}>
                <span className={styles.typeItem} aria-label={label}>
                  <span className={styles.value}>{label}</span>
                  <span className={styles.type}>{platform}</span>
                </span>
              </Option>
            );
          })}
        </Select>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{intl.get('import.filePath')}</span>
        <div className={styles.operations}>
          <div className={styles.path}>{path}</div>
          <div className={cls(styles.btn, !path && styles.disabled)} onClick={handlePathBack}>
            <ArrowLeftOutlined />
          </div>
          <div className={styles.btn} onClick={handleRefresh}>
            <SyncOutlined />
          </div>
        </div>
      </div>
      <div className={styles.fileDirectory}>
        {directory?.map((item) => (
          <div
            key={item.name}
            className={cls(styles.item, activeItem === item && styles.actived)}
            onClick={() => setState({ activeItem: item })}
            onDoubleClick={() => handleSelectFile(item)}
          >
            {item.type === 'directory' ? (
              <FolderFilled className={styles.icon} />
            ) : (
              <FileTextFilled className={styles.icon} />
            )}
            <div className={styles.content}>
              <Tooltip title={item.name}>
                <span className={styles.title}>{item.name}</span>
              </Tooltip>
              <span className={styles.desc}>
                {item.type === 'directory' ? intl.get('import.directory') : getFileSize(item.size)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.btns}>
        <Button
          type="primary"
          disabled={!activeItem || activeItem.type === 'directory'}
          onClick={() => handleConfirm()}
        >
          {intl.get('common.add')}
        </Button>
      </div>
    </Spin>
  );
});

export default FileSelect;
