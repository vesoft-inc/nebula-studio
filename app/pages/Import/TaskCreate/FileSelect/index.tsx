import { Button, Form, Popover, Select } from 'antd';
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { v4 as uuidv4 } from 'uuid';
import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';

const Option = Select.Option;

interface IProps {
  type: 'vertices' | 'edge';
}
const FormItem = Form.Item;

const FileSelect = (props: IProps) => {
  const { type } = props;
  const { files, dataImport: { update, verticesConfig, edgeConfig } } = useStore();
  const { fileList, getFiles } = files;
  const [visible, setVisible] = useState(false);
  const { intl } = useI18n();
  const onFinish = (value) => {
    const file = fileList.filter(item => item.name === value.name)[0];
    if(type === 'vertices') {
      update({
        verticesConfig: [...verticesConfig, {
          name: uuidv4(),
          file,
          tags: [],
          idMapping: null,
        }]
      });
    } else {
      update({
        edgeConfig: [...edgeConfig, {
          name: uuidv4(),
          file,
          props: [],
          type: '',
        }]
      });
    }
    setVisible(false);
  };

  const handleGetFiles = () => {
    if(fileList.length === 0) {
      getFiles();
    }
  };
  
  return (
    <Popover
      destroyTooltipOnHide={true}
      overlayClassName={styles.popoverFileSelect}
      open={visible}
      trigger="click"
      onOpenChange={visible => setVisible(visible)}
      content={<Form className={styles.fileSelectForm} onFinish={onFinish} layout="inline">
        <FormItem name="name" rules={[{ required: true, message: intl.get('formRules.fileRequired') }]}>
          <Select className={styles.fileSelect} showSearch={true} onDropdownVisibleChange={handleGetFiles} dropdownMatchSelectWidth={false}>
            {fileList.map((file: any) => (
              <Option value={file.name} key={file.name}>
                {file.name}
              </Option>
            ))}
          </Select>
        </FormItem>
        <FormItem>
          <Button htmlType="submit" type="primary">
            {intl.get('common.confirm')}
          </Button>
        </FormItem>
      </Form>}
      title={intl.get('import.selectFile')}
    >
      <Button type="primary" className="studioAddBtnIcon" onClick={() => setVisible(true)}>
        <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
        {intl.get('import.bindDatasource')}
      </Button>
    </Popover>
  );
};

export default observer(FileSelect);
