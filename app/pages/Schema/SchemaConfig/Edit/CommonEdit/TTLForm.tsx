import { Button, Checkbox, Col, Form, Input, Modal, Popconfirm, Row, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { IAlterForm, IProperty, ISchemaType } from '@app/interfaces/schema';

import './index.less';

const confirm = Modal.confirm;
const Option = Select.Option;
const innerItemLayout = {
  labelCol: {
    span: 8,
  },
  wrapperCol: {
    span: 14,
  },
};

interface IProps {
  editType: ISchemaType
  initialRequired: boolean;
  editDisabled: boolean;
  onBeforeEdit: (type?: null) => void;
  onEdit: (config: IAlterForm) => void;
  checkIndex: () => Promise<boolean>;
  data: { 
    name: string,
    properties: IProperty[],
    ttlConfig: {
      duration: string,
      col: string
    }
  }
}

const formRef = ((props: IProps) => {
  const { 
    editType,
    initialRequired, 
    editDisabled, 
    checkIndex,
    data, 
    onEdit,
    onBeforeEdit } = props;
  const { name, properties, ttlConfig: { col, duration } } = data;
  const [ttlRequired, setTtlRequired] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [ttlOptions, setTtlOptions] = useState<IProperty[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    setTtlRequired(initialRequired);
  }, [initialRequired]);

  useEffect(() => {
    setIsEdit(false);
  }, [data]);

  useEffect(() => {
    if(isEdit) {
      const list = properties.filter(i =>
        ['int', 'int64', 'timestamp'].includes(i.type),
      );
      setTtlOptions(list);
    }
  }, [isEdit]);
  useEffect(() => {
    form.resetFields();
  }, [editConfig]);
  const handleClearTtl = async e => {
    const clear = e.target.checked;
    if(clear) {
      const hasIndex = await checkIndex();
      if (hasIndex) {
        return message.warning(intl.get('schema.indexExist'));
      }
      setTtlRequired(true);
      handleEditBefore();
    } else {
      confirm({
        title: intl.get('schema.cancelOperation'),
        content: intl.get('schema.cancelPropmt'),
        okText: intl.get('common.yes'),
        cancelText: intl.get('common.no'),
        onOk: handleTtlDelete,
      });
    }
  };

  const handleTtlDelete = () => {
    onEdit({
      type: editType,
      name,
      action: 'TTL',
      config: {
        ttl: {
          col: '',
        },
      },
    });
  };
  const handleTtlUpdate = (values) => {
    onEdit({
      type: editType,
      name,
      action: 'TTL',
      config: {
        ttl: values,
      },
    });
  };

  const handleEditBefore = () => {
    setEditConfig({
      col,
      duration
    });
    setIsEdit(true);
    onBeforeEdit();
  };

  const handleEditCancel = () => {
    onBeforeEdit(null);
    setIsEdit(false);
    if(!col) {
      setTtlRequired(false);
    }
  };
  return (
    <Form 
      form={form}
      className="form-item" 
      onFinish={handleTtlUpdate} 
      {...innerItemLayout} 
      layout="vertical">
      <Form.Item>
        <Checkbox disabled={editDisabled} checked={ttlRequired} onChange={handleClearTtl}>
          <span className="label">{intl.get('schema.setTTL')}</span>
        </Checkbox>
      </Form.Item>
      {!isEdit && <Form.Item noStyle>
        <div className="box-container">
          <Row>
            <Col span={12}>
              <Form.Item className="inline-item" label="TTL_COL">
                {col}
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item className="inline-item" label="TTL_DURATION">
                {duration === '0' && col === '' ? '' : duration }
              </Form.Item>
            </Col>
            {col !== '' && <Col span={3} className="operations">
              <Form.Item noStyle>
                <Button
                  type="link"
                  onClick={handleEditBefore}
                  disabled={editDisabled}
                >
                  {intl.get('common.edit')}
                </Button>
                <Popconfirm
                  onConfirm={handleTtlDelete}
                  title={intl.get('common.ask')}
                  okText={intl.get('common.ok')}
                  cancelText={intl.get('common.cancel')}
                >
                  <Button
                    type="link"
                    disabled={editDisabled}
                  >
                    {intl.get('common.delete')}
                  </Button>
                </Popconfirm>
              </Form.Item>
            </Col>}
          </Row>
        </div>
      </Form.Item>}

      {isEdit && <Form.Item noStyle shouldUpdate={true}>
        <div className="box-container">
          <Row>
            <Col span={12}>
              <Form.Item
                className="inline-item" 
                label="TTL_COL" 
                name="col" 
                initialValue={editConfig.col} 
                rules={[
                  {
                    required: true,
                    message: intl.get('formRules.ttlRequired'),
                  },
                ]}>
                <Select>
                  {ttlOptions.map(i => (
                    <Option value={i.name} key={i.name}>
                      {i.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item
                className="inline-item" 
                label="TTL_DURATION"  
                name="duration"
                initialValue={editConfig.duration} 
                rules={[
                  {
                    required: true,
                    message: intl.get('formRules.ttlDurationRequired'),
                  },
                  {
                    message: intl.get('formRules.positiveIntegerRequired'),
                    pattern: /^\d+$/,
                    transform(value) {
                      if (value) {
                        return Number(value);
                      }
                    },
                  },
                ]}>
                <Input
                  disabled={!ttlRequired}
                  placeholder={intl.get('formRules.ttlDurationRequired')}
                />
              </Form.Item>
            </Col>
            <Col span={3} className="operations">
              <Form.Item noStyle>
                <Button
                  type="link"
                  htmlType="submit"
                >
                  {intl.get('common.ok')}
                </Button>
                <Button
                  type="link"
                  onClick={handleEditCancel}
                >
                  {intl.get('common.cancel')}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form.Item>}
    </Form>
  );
});

export default observer(formRef);
