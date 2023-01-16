import { Collapse, Input, Select, Table, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import cls from 'classnames';
import { useStore } from '@app/stores';
import { useI18n } from '@vesoft-inc/i18n';
import { IFileMapping } from '@app/interfaces/import';
import CSVPreviewLink from '@app/components/CSVPreviewLink';
import { CloseOutlined } from '@ant-design/icons';
import Instruction from '@app/components/Instruction';
import { ISchemaEnum } from '@app/interfaces/schema';
import styles from '../index.module.less';

const Option = Select.Option;
const Panel = Collapse.Panel;

interface IProps {
  data: IFileMapping
  onRemove: (file: IFileMapping) => void;
  type: ISchemaEnum
}

const VIDSetting = observer((props: {
  onUpdate: (key: string, value: any) => void;
  data: IFileMapping,
  keyMap: {
    idKey: string,
    idFunction: string,
    idPrefix: string,
  }
}) => {
  const { onUpdate, keyMap: { idKey, idFunction, idPrefix }, data } = props;
  const { intl } = useI18n();
  return <div className={styles.row}>
    <Collapse bordered={false} ghost className={styles.vidCollapse}>
      <Panel header={<div className={cls(styles.panelTitle, styles.spaceBetween)}>
        <div>
          <span className={cls(styles.label, styles.required)}>{intl.get(`import.vidColumn`)}</span>
          <CSVPreviewLink
            onMapping={(index, e) => {
              e.stopPropagation();
              onUpdate(idKey, index);
            }}
            file={data.file}
          >
            {!data[idKey] && data[idKey] !== 0 ? intl.get('import.selectCsvColumn') : `Column ${data[idKey]}`}
          </CSVPreviewLink>
        </div>
        <Instruction description={<>
          <div>
            <span className={styles.title}>{intl.get('import.vidFunction')}</span>
            <span>{intl.get('import.vidFunctionTip')}</span>
          </div>
          <div>
            <span className={styles.title}>{intl.get('import.vidPrefix')}</span>
            <span>{intl.get('import.vidPrefixTip')}</span>
          </div>
        </>} />
      </div>} key="default">
        <div className={styles.rowItem}>
          <span className={styles.label}>{intl.get('import.vidFunction')}</span>
          <Select
            bordered={false}
            placeholder="Select"
            className={styles.functionSelect}
            allowClear={true}
            value={data[idFunction]}
            dropdownMatchSelectWidth={false}
            popupClassName={styles.selectItems}
            onClick={e => e.stopPropagation()}
            onChange={value => onUpdate(idFunction, value)}
          >
            <Option value="hash">Hash</Option>
          </Select>
        </div>
        <div className={styles.rowItem}>
          <span className={styles.label}>{intl.get('import.vidPrefix')}</span>
          <Input className={styles.prefixInput} bordered={false} placeholder="Input prefix" value={data[idPrefix]} onChange={e => onUpdate(idPrefix, e.target.value)} />
        </div>
      </Panel>
    </Collapse>
  </div>;
});

const idMap = {
  [ISchemaEnum.Tag]: [{
    idKey: 'vidIndex',
    idFunction: 'vidFunction',
    idPrefix: 'vidPrefix',
  }],
  [ISchemaEnum.Edge]: [{
    idKey: 'srcIdIndex',
    idFunction: 'srcIdFunction',
    idPrefix: 'srcIdPrefix',
  }, {
    idKey: 'dstIdIndex',
    idFunction: 'dstIdFunction',
    idPrefix: 'dstIdPrefix',
  }],
};

const FileMapping = (props: IProps) => {
  const { data, onRemove, type } = props;
  const { dataImport, files } = useStore();
  const { fileList, getFiles } = files;
  const { updateFileSource, updateFileConfig, updateFilePropMapping } = dataImport;
  const { intl } = useI18n();

  const handleFileChange = (value) => {
    const file = fileList.find(item => item.name === value);
    updateFileSource(data, file);
  };
  const columns = [
    {
      title: intl.get('import.prop'),
      dataIndex: 'name',
      ellipsis: {
        showTitle: false,
      },
      render: (value, record) => (
        <Tooltip placement="topLeft" title={value}>
          <div className={!record.isDefault && styles.required}>
            {value}
          </div>
          {/* {!record.isDefault && <span className="csv-index-mark">*</span>} */}
        </Tooltip>
      ),
    },
    {
      title: intl.get('import.mapping'),
      dataIndex: 'mapping',
      render: (mappingIndex, prop, propIndex) => (
        <CSVPreviewLink
          onMapping={columnIndex => {
            updateFilePropMapping(data, propIndex, columnIndex);
            console.log('param', mappingIndex, prop, propIndex, columnIndex); 
          }
          }
          file={data.file}
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
  const handleGetFiles = () => {
    if(fileList.length === 0) {
      getFiles();
    }
  };

  const handleUpdate = (key: string, value: any) => {
    updateFileConfig(data, key, value);
  };
  const idConfig = useMemo(() => type === ISchemaEnum.Tag ? idMap[ISchemaEnum.Tag] : idMap[ISchemaEnum.Edge], [type]);
  return (
    <div className={styles.fileMappingContainer}>
      <div className={cls(styles.row, styles.spaceBetween)}>
        <div>
          <span className={cls(styles.label, styles.required)}>{intl.get('import.dataSourceFile')}</span>
          <Select 
            bordered={false}
            placeholder={intl.get('import.selectFile')}
            showSearch={true} 
            className={styles.fileSelect}
            onDropdownVisibleChange={handleGetFiles} 
            onChange={handleFileChange}
            dropdownMatchSelectWidth={false}>
            {fileList.map((file: any) => (
              <Option value={file.name} key={file.name}>
                {file.name}
              </Option>
            ))}
          </Select>
        </div>
        <CloseOutlined className={styles.btnClose} onClick={() => onRemove(data)} />
      </div>
      {idConfig.map((item, index) => <VIDSetting key={index} keyMap={item} data={data} onUpdate={handleUpdate} />)}
      {data.props && <Table
        className={styles.propsMappingTable}
        dataSource={data.props}
        columns={columns}
        rowKey="name"
        pagination={false}
      />}
    </div>
  );
};

export default observer(FileMapping);
