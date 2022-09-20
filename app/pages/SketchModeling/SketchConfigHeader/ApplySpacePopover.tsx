import { Popover, Radio, Button, Form, Select } from 'antd';
import React, { useCallback, useState } from 'react';
import intl from 'react-intl-universal';
import CreateForm from '@app/pages/Schema/SpaceCreate/CreateForm';
import { useStore } from '@app/stores';
import { ExclamationCircleTwoTone } from '@ant-design/icons';
import styles from './index.module.less';

const Option = Select.Option;
const formItemLayout = {
  labelCol: {
    span: 24,
  },
  wrapperCol: {
    span: 24,
  },
};

interface IContentProps {
  close: () => void;
}

const PopoverContent = (props: IContentProps) => {
  const { close } = props;
  const [mode, setMode] = useState('create' as 'create' | 'apply');
  const [spaces, setSpaces] = useState<string[]>([]);
  const [form] = Form.useForm();
  const {
    schema: { getMachineNumber, getSpaces },
  } = useStore();
  const handleChangeMode = async (e: any) => {
    const { value } = e.target;
    setMode(value);
    if (value === 'create') {
      getMachineNumber();
    } else {
      const { code, data } = await getSpaces();
      code === 0 && setSpaces(data);
    }
  };

  const handleConfirm = () => {
    form.validateFields();
  };
  return (
    <>
      <Radio.Group className={styles.radioTabs} onChange={handleChangeMode} value={mode} buttonStyle="solid">
        <Radio.Button value="create">{intl.get('sketch.createSpace')}</Radio.Button>
        <Radio.Button value="apply">{intl.get('sketch.selectSpace')}</Radio.Button>
      </Radio.Group>
      {mode === 'create' ? (
        <CreateForm form={form} activeMachineNum={1} colSpan="full" formItemLayout={formItemLayout} />
      ) : (
        <Form className={styles.applyForm} form={form} {...formItemLayout}>
          <Form.Item
            label={intl.get('explore.selectSpace')}
            name="space"
            rules={[{ required: true, message: intl.get('formRules.spaceRequired') }]}
          >
            <Select>
              {spaces.map((space) => (
                <Option value={space} key={space}>
                  {space}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={false}>
            <div className={styles.applyTips}>
              <ExclamationCircleTwoTone />
              <span>The new schema will not overwrite the original schema in the space</span>
            </div>
          </Form.Item>
        </Form>
      )}
      <div className={styles.formFooter}>
        <Button onClick={close}>{intl.get('common.cancel')}</Button>
        <Button type="primary" onClick={handleConfirm}>
          {intl.get('common.confirm')}
        </Button>
      </div>
    </>
  );
};

export default function ApplySpacePopover() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const handleOpen = () => {
    // TODO 校验参数
    setOpen(true);
  };
  return (
    <Popover
      overlayClassName={styles.applyPopover}
      placement="bottom"
      content={<PopoverContent close={close} />}
      arrowPointAtCenter={true}
      trigger="click"
      open={open}
    >
      <Button type="primary" onClick={handleOpen}>
        {intl.get('sketch.applyToSpace')}
      </Button>
    </Popover>
  );
}
