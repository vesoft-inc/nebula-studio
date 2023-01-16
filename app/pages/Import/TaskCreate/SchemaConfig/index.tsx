import { Button, Collapse, Select } from 'antd';
import React, { useCallback } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import cls from 'classnames';

import { ISchemaEnum, ISchemaType } from '@app/interfaces/schema';
import { IFileMapping, IImportSchemaConfig } from '@app/interfaces/import';
import styles from './index.module.less';
import FileMapping from './FileMapping';
const { Panel } = Collapse;
const Option = Select.Option;
interface IProps {
  data: IImportSchemaConfig
}

interface IHeaderProps {
  type: ISchemaType;
  value: string;
  onSelect: (value: string) => void;
}

const SelectMappingTargetHeader = observer((props: IHeaderProps) => {
  const { value, type, onSelect } = props;
  const { dataImport, schema } = useStore();
  const { tags, edgeTypes } = schema;
  const { tagConfig, edgesConfig } = dataImport;
  const { intl } = useI18n();
  const config = type === ISchemaEnum.Tag ? tagConfig : edgesConfig;
  const targetList = type === ISchemaEnum.Tag ? tags : edgeTypes;
  return <div className={styles.panelTitle}>
    <span className={cls(styles.label, styles.required)}>{intl.get(`common.${type}`)}</span>
    <Select
      bordered={false}
      className={cls(styles.configTargetSelect, { [styles.noValue]: !value })}
      placeholder={intl.get(type === ISchemaEnum.Tag ? 'import.selectTag' : 'import.selectEdge')}
      value={value}
      dropdownMatchSelectWidth={false}
      popupClassName={styles.selectItems}
      onClick={e => e.stopPropagation()}
      onChange={onSelect}
    >
      {targetList.filter(t => !config.some(c => c.name === t)).map(t => (
        <Option value={t} key={t}>
          {t}
        </Option>
      ))}
    </Select>
  </div>;
});
const SchemaConfig = (props: IProps) => {
  const { data } = props;
  const { dataImport } = useStore();
  const { name, files, type } = data;
  const { addFileSource, removeConfigItem, updateConfigItemTarget, removeFileSource } = dataImport;
  const { intl } = useI18n();

  const addFile = useCallback(() => addFileSource(data), [data]);

  const handleRemove = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    removeConfigItem(data);
  }, [data]);

  const changeMappingTarget = useCallback((value) => {
    updateConfigItemTarget({ data, value });
  }, [data]);

  const clearFileSource = (item: IFileMapping) => {
    removeFileSource(data, item);
  };
  return (
    <Collapse
      bordered={false}
      defaultActiveKey={['default']}
      className={styles.configCollapse}
    >
      <Panel header={<SelectMappingTargetHeader value={name} type={type} onSelect={changeMappingTarget} />} key="default" extra={<CloseOutlined className={styles.btnClose} onClick={handleRemove} />}>
        {files.map((item:IFileMapping, index) => <FileMapping key={index} type={data.type} data={item} onRemove={clearFileSource} />)}
        {!!name && <div className={styles.btns}>
          <Button className="primaryBtn studioAddBtn" onClick={addFile}>
            <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
            {intl.get('import.bindDatasource')}
          </Button>
        </div>}
      </Panel>
    </Collapse>
  );
};

export default observer(SchemaConfig);
