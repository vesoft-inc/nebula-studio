import { Button, Collapse, Input, Select, Table, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import cls from 'classnames';
import { useStore } from '@app/stores';
import { useI18n } from '@vesoft-inc/i18n';
import CSVPreviewLink from '@app/components/CSVPreviewLink';
import { CloseOutlined } from '@ant-design/icons';
import Instruction from '@app/components/Instruction';
import { ISchemaEnum } from '@app/interfaces/schema';
import { IEdgeFileItem, ITagFileItem } from '@app/stores/import';
import { IImportFile } from '@app/interfaces/import';
import { ICachedStore } from '@app/stores/datasource';
import { trackEvent } from '@app/utils/stat';
import styles from '../index.module.less';
import FileSelectModal from './FileSelectModal';

const Option = Select.Option;
const Panel = Collapse.Panel;

interface IProps {
  item: ITagFileItem | IEdgeFileItem;
  onRemove: (file: ITagFileItem | IEdgeFileItem) => void;
  onReset: (item: ITagFileItem | IEdgeFileItem, file: IImportFile) => void;
  type: ISchemaEnum;
}

const VIDSetting = observer(
  (props: {
    data: ITagFileItem | IEdgeFileItem;
    keyMap: {
      idKey: string;
      idFunction?: string;
      idPrefix?: string;
      idSuffix?: string;
      label: string;
    };
  }) => {
    const {
      keyMap: { idKey, idFunction, idPrefix, idSuffix, label },
      data,
    } = props;
    const { intl } = useI18n();
    const { schema } = useStore();
    const { spaceVidType } = schema;
    const [key, setKey] = useState(null);
    const handleChange = useCallback((v) => setKey(v), []);
    const handleMapping = useCallback(
      (index) => {
        data.update({ [idKey]: index });
        index?.length > 1 && setKey(['default']);
      },
      [data, idKey],
    );
    useEffect(() => {
      ([idPrefix, idSuffix, idFunction].some((i) => !!data[i]) || data[idKey].length > 1) && setKey(['default']);
    }, []);
    return (
      <div className={styles.row}>
        <Collapse bordered={false} ghost className={styles.vidCollapse} onChange={handleChange} activeKey={key}>
          <Panel
            header={
              <div className={cls(styles.panelTitle, styles.spaceBetween)}>
                <div>
                  <span className={cls(styles.label, styles.required)}>{intl.get(`import.${label}`)}</span>
                  <CSVPreviewLink
                    onMapping={(index) => handleMapping(index)}
                    // @ts-ignore
                    file={data.file}
                    data={data[idKey]}
                    multipleMode={true}
                  >
                    {!data[idKey] || data[idKey].length === 0
                      ? intl.get('import.selectCsvColumn')
                      : data[idKey].map((i) => `Column ${i}`).join(', ')}
                  </CSVPreviewLink>
                </div>
                <Instruction
                  description={
                    <>
                      <div>
                        <span className={styles.title}>{intl.get('import.vidFunction')}</span>
                        <span>{intl.get('import.vidFunctionTip')}</span>
                      </div>
                      <div>
                        <span className={styles.title}>{intl.get('import.vidPrefix')}</span>
                        <span>{intl.get('import.vidPrefixTip')}</span>
                      </div>
                      <div>
                        <span className={styles.title}>{intl.get('import.vidSuffix')}</span>
                        <span>{intl.get('import.vidSuffixTip')}</span>
                      </div>
                    </>
                  }
                />
              </div>
            }
            key="default"
          >
            {spaceVidType === 'INT64' && idFunction && (
              <div className={styles.funcItem}>
                <span className={styles.label}>{intl.get('import.vidFunction')}</span>
                <Select
                  bordered={false}
                  placeholder="Select"
                  className={styles.functionSelect}
                  allowClear={true}
                  value={data[idFunction]}
                  popupMatchSelectWidth={false}
                  popupClassName={styles.selectItems}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(value) => {
                    data.update({ [idFunction]: value });
                    trackEvent('import', 'add_vidFunction');
                  }}
                >
                  <Option value="hash">Hash</Option>
                </Select>
              </div>
            )}
            {idPrefix && (
              <div className={styles.rowItem}>
                <span className={styles.label}>{intl.get('import.vidPrefix')}</span>
                <Input
                  className={styles.prefixInput}
                  bordered={false}
                  placeholder="Input prefix"
                  value={data[idPrefix]}
                  onChange={(e) => {
                    data.update({ [idPrefix]: e.target.value });
                    trackEvent('import', 'add_vidPrefix');
                  }}
                />
              </div>
            )}
            {idSuffix && (
              <div className={styles.rowItem}>
                <span className={styles.label}>{intl.get('import.vidSuffix')}</span>
                <Input
                  className={styles.prefixInput}
                  bordered={false}
                  placeholder="Input suffix"
                  value={data[idSuffix]}
                  onChange={(e) => {
                    data.update({ [idSuffix]: e.target.value });
                    trackEvent('import', 'add_vidSuffix');
                  }}
                />
              </div>
            )}
            {(data[idKey]?.length > 1 || data[idPrefix] || data[idSuffix]) && (
              <div className={styles.concatPreview}>
                <span className={styles.label}>{intl.get('import.preview')}</span>
                <div className={styles.concatItems}>
                  {data[idPrefix] && <span className={styles.tagItem}>{data[idPrefix]}</span>}
                  {data[idKey].map((i) => (
                    <span key={i} className={styles.tagItem}>{`Column ${i}`}</span>
                  ))}
                  {data[idSuffix] && <span className={styles.tagItem}>{data[idSuffix]}</span>}
                </div>
              </div>
            )}
          </Panel>
        </Collapse>
      </div>
    );
  },
);

const idMap = {
  [ISchemaEnum.Tag]: [
    {
      idKey: 'vidIndex',
      idFunction: 'vidFunction',
      idPrefix: 'vidPrefix',
      idSuffix: 'vidSuffix',
      label: 'vidColumn',
    },
  ],
  [ISchemaEnum.Edge]: [
    {
      idKey: 'srcIdIndex',
      idFunction: 'srcIdFunction',
      label: 'srcVidColumn',
      idPrefix: 'srcIdPrefix',
      idSuffix: 'srcIdSuffix',
    },
    {
      idKey: 'dstIdIndex',
      idFunction: 'dstIdFunction',
      label: 'dstVidColumn',
      idPrefix: 'dstIdPrefix',
      idSuffix: 'dstIdSuffix',
    },
  ],
};

const FileMapping = (props: IProps) => {
  const { item, onRemove, type, onReset } = props;
  const { file, props: mappingProps } = item;
  const {
    datasource: { cachedStore, update },
  } = useStore();
  const { intl } = useI18n();
  const [visible, setVisible] = useState(false);
  const [selectFile, setSelectFile] = useState({
    file: null,
    cachedState: null,
  });

  useEffect(() => {
    item.file &&
      setSelectFile({
        file: item.file,
        cachedState: null,
      });
    cachedStore &&
      setSelectFile({
        file: null,
        cachedState: cachedStore,
      });
  }, []);
  const updateFilePropMapping = (index: number, value: number) => item.updatePropItem(index, { mapping: value });
  const columns = [
    {
      title: intl.get('import.prop'),
      dataIndex: 'name',
      ellipsis: {
        showTitle: false,
      },
      render: (value, record) => {
        return (
          <Tooltip placement="topLeft" title={value}>
            <div className={cls({ [styles.required]: !record.isDefault && !record.allowNull })}>{value}</div>
          </Tooltip>
        );
      },
    },
    {
      title: intl.get('import.mapping'),
      dataIndex: 'mapping',
      render: (mappingIndex, _, propIndex) => (
        <CSVPreviewLink
          onMapping={(columnIndex) => updateFilePropMapping(propIndex, columnIndex as number)}
          // @ts-ignore
          file={file}
          data={item[propIndex]?.mapping}
        >
          {!mappingIndex && mappingIndex !== 0 ? intl.get('import.choose') : `Column ${mappingIndex}`}
        </CSVPreviewLink>
      ),
    },
    {
      title: intl.get('common.type'),
      dataIndex: 'type',
    },
  ];

  const handleUpdateFile = (file, cachedState: ICachedStore) => {
    setSelectFile({ file, cachedState });
    onReset(item, file);
    setVisible(false);
    const { directory, path, activeId } = cachedState;
    // update cached store, so that we can use it when initializing other file configurations
    update({
      cachedStore: {
        directory,
        path,
        activeId,
      },
    });
  };

  const idConfig = useMemo(() => (type === ISchemaEnum.Tag ? idMap[ISchemaEnum.Tag] : idMap[ISchemaEnum.Edge]), [type]);
  return (
    <div className={styles.fileMappingContainer}>
      <div className={cls(styles.row, styles.spaceBetween)}>
        <div className={styles.operation}>
          <span className={cls(styles.label, styles.required)}>{intl.get('import.dataSourceFile')}</span>
          <Button type="link" onClick={() => setVisible(true)}>
            {selectFile.file ? selectFile.file.name : intl.get('import.selectFile')}
          </Button>
          {selectFile.file && (
            <div className={styles.pathRow}>
              <span className={styles.pathLabel}>{intl.get('import.filePath')}</span>
              <span className={styles.pathValue}>
                {selectFile.cachedState
                  ? selectFile.cachedState.path + selectFile.file.name
                  : selectFile.file.path || selectFile.file.name}
              </span>
            </div>
          )}
        </div>
        <CloseOutlined className={styles.btnClose} onClick={() => onRemove(item)} />
      </div>
      {idConfig.map((idItem, index) => (
        <VIDSetting key={index} keyMap={idItem} data={item} />
      ))}
      <Table
        className={styles.propsMappingTable}
        dataSource={mappingProps.toJSON()}
        columns={columns}
        rowKey="name"
        pagination={false}
      />
      {visible && (
        <FileSelectModal
          visible={visible}
          cachedDatasourceState={selectFile.cachedState}
          onCancel={() => setVisible(false)}
          onConfirm={handleUpdateFile}
        />
      )}
    </div>
  );
};

export default observer(FileMapping);
