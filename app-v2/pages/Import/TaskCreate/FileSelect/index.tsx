import { Button, Form, Popover, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import { v4 as uuidv4 } from 'uuid';
import './index.less';

const Option = Select.Option;

interface IProps {
  type: 'vertices' | 'edge';
}
const FormItem = Form.Item;

const FileSelect = (props: IProps) => {
  const { type } = props;
  const { files, dataImport: { update, verticesConfig, edgesConfig } } = useStore();
  const { fileList, asyncGetFiles } = files;
  const [visible, setVisible] = useState(false);
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
        edgesConfig: [...edgesConfig, {
          name: uuidv4(),
          file,
          props: [],
          type: '',
        }]
      });
    }
    setVisible(false);
  };
  useEffect(() => {
    asyncGetFiles();
  }, []);
  return (
    <Popover
      destroyTooltipOnHide={true}
      overlayClassName="popover-file-select"
      visible={visible}
      trigger="click"
      onVisibleChange={visible => setVisible(visible)}
      content={<Form className="file-select-form" onFinish={onFinish} layout="inline">
        <FormItem name="name" rules={[{ required: true }]}>
          <Select className="file-select" showSearch={true} dropdownMatchSelectWidth={false}>
            {fileList.map((file: any) => (
              <Option value={file.name} key={file.name}>
                {file.name}
              </Option>
            ))}
          </Select>
        </FormItem>
        <FormItem>
          <Button htmlType="submit" type="primary">
            {intl.get('import.confirm')}
          </Button>
        </FormItem>
      </Form>}
      title={intl.get('import.selectFile')}
    >
      <Button type="primary" className="btn-bind-source" onClick={() => setVisible(true)}>
        + {intl.get('import.bindDatasource')}
      </Button>
    </Popover>
  );
};

export default observer(FileSelect);
