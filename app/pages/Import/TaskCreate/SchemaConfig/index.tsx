import { Button, Collapse, Select } from 'antd';
import React, { useCallback } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import cls from 'classnames';

import { ISchemaEnum, ISchemaType } from '@app/interfaces/schema';
import { ITagItem, IEdgeItem, ITagFileItem, IEdgeFileItem, TagFileItem, EdgeFileItem } from '@app/stores/import';
import { IImportFile } from '@app/interfaces/import';
import styles from './index.module.less';
import FileMapping from './FileMapping';
const { Panel } = Collapse;
const Option = Select.Option;
interface IProps {
  configItem: ITagItem | IEdgeItem
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
  const { tagConfig, edgeConfig } = dataImport;
  const { intl } = useI18n();
  const config = type === ISchemaEnum.Tag ? tagConfig : edgeConfig;
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
  const { configItem } = props;
  const { dataImport } = useStore();
  const { name, files, type } = configItem;
  const { deleteTagConfig, deleteEdgeConfig, updateConfigItemName } = dataImport;
  const { intl } = useI18n();

  const addFileSource = useCallback(() => {
    const payload = { file: undefined, props: configItem.props };
    configItem.addFileItem(configItem.type === ISchemaEnum.Tag ? new TagFileItem(payload) : new EdgeFileItem(payload));
  }, [configItem]);

  const resetFileSource = useCallback((item: ITagFileItem | IEdgeFileItem, file: IImportFile) => {
    const index = configItem.files.findIndex(f => f === item);
    const payload = { file, props: [...configItem.props] };
    configItem.resetFileItem(index, configItem.type === ISchemaEnum.Tag ? new TagFileItem(payload) : new EdgeFileItem(payload));
  }, [configItem]);


  const handleRemove = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    configItem.type === ISchemaEnum.Tag ? deleteTagConfig(configItem) : deleteEdgeConfig(configItem);
  }, [configItem]);

  const changeMappingTarget = useCallback((name: string) => {
    updateConfigItemName(configItem, name);
  }, [configItem]);

  const clearFileSource = useCallback((item: ITagFileItem | IEdgeFileItem) => configItem.deleteFileItem(item), [configItem]);
  return (
    <Collapse
      bordered={false}
      defaultActiveKey={['default']}
      className={styles.configCollapse}
    >
      <Panel header={<SelectMappingTargetHeader value={name} type={type} onSelect={changeMappingTarget} />} key="default" extra={<CloseOutlined className={styles.btnClose} onClick={handleRemove} />}>
        {files.map((item: ITagFileItem | IEdgeFileItem, index) => <FileMapping key={index} type={configItem.type} item={item} onRemove={clearFileSource} onReset={resetFileSource} />)}
        {!!name && <div className={styles.btns}>
          <Button className="primaryBtn studioAddBtn" onClick={addFileSource}>
            <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
            {intl.get('import.bindDatasource')}
          </Button>
        </div>}
      </Panel>
    </Collapse>
  );
};

export default observer(SchemaConfig);
