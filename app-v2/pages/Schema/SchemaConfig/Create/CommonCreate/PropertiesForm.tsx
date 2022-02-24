import { Button, Checkbox, Col, Form, Input, Popover, Row, Select } from 'antd';
import { FormInstance } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { nameRulesFn, numberRulesFn } from '@appv2/config/rules';
import Icon from '@appv2/components/Icon';
import { DATA_TYPE, EXPLAIN_DATA_TYPE } from '@appv2/utils/constant';

const Option = Select.Option;
import './index.less';


const itemLayout = {
  wrapperCol: {
    span: 20,
  },
};

interface IProps {
  formRef: FormInstance
}

const PropertiesForm = (props: IProps) => {
  const { formRef } = props;
  const handleClearProperties = e => {
    if(!e.target.checked) {
      formRef.resetFields(['properties', []]);
    }
  };
  const handlePropertyAdd = callback => {
    const properties = formRef.getFieldValue('properties');
    if (properties && properties.length > 0) {
      callback({
        name: '',
        type: '',
        fixedLength: null,
        allowNull: true,
        value: '',
      });
    } else {
      formRef.setFieldsValue({
        properties: [
          {
            name: '',
            type: '',
            fixedLength: null,
            allowNull: true,
            value: '',
          },
        ],
      });
    }
  };
  const handlePropertyDelete = (rowIndex, callback) => {
    const properties = formRef.getFieldValue('properties');
    const ttl_col = formRef.getFieldValue('ttl_col');
    if(properties[rowIndex].name === ttl_col) {
      formRef.resetFields(['ttl_col', '']);
    }
    callback(rowIndex);
  };
  return (
    <Form.Item noStyle={true}>
      <div className="form-item">
        <Form.Item name="propertiesRequired" valuePropName="checked" initialValue={true}>
          <Checkbox onChange={handleClearProperties}>
            <span className="label">{intl.get('_schema.defineFields')}</span>
          </Checkbox>
        </Form.Item>
        <Form.Item noStyle={true} shouldUpdate={true}>
          {({ getFieldValue }) => {
            const propertiesRequired = getFieldValue('propertiesRequired');
            const properties = getFieldValue('properties') || [];
            return (
              <div className="box-container">
                <Form.List name="properties">
                  {(fields, { add, remove }) => {
                    return (
                      <Form.Item noStyle={true}>
                        <Form.Item noStyle={true}>
                          <Button 
                            type="primary" 
                            className="studio-add-btn" 
                            disabled={!propertiesRequired}
                            onClick={() => handlePropertyAdd(add)}>
                            <Icon className="studio-add-btn-icon" type="icon-btn-add" />
                            {intl.get('common.addProperty')}
                          </Button>
                        </Form.Item>
                        <Form.Item noStyle={true}>
                          <Row className="form-header">
                            <Col span={4} className="required-item">{intl.get('common.propertyName')}</Col>
                            <Col span={6} className="required-item">{intl.get('common.dataType')}</Col>
                            <Col span={3}>{intl.get('common.allowNull')}</Col>
                            <Col span={5}>{intl.get('common.defaults')}</Col>
                            <Col span={4}>{intl.get('common.comment')}</Col>
                          </Row>
                        </Form.Item>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <React.Fragment key={key}>
                            <Row className="fields-item">
                              <Col span={4}>
                                <Form.Item 
                                  name={[name, 'name']} 
                                  {...restField} 
                                  {...itemLayout} 
                                  rules={nameRulesFn(intl)}>
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item 
                                  name={[name, 'type']} 
                                  {...restField} 
                                  {...itemLayout} 
                                  wrapperCol={{ span: 14 }} 
                                  rules={[
                                    {
                                      required: true,
                                      message: intl.get('formRules.dataTypeRequired'),
                                    },
                                  ]}>
                                  <Select className="select-type" showSearch={true} dropdownMatchSelectWidth={false}>
                                    {DATA_TYPE.map(item => {
                                      return (
                                        <Option value={item.value} key={item.value}>
                                          {item.label}
                                        </Option>
                                      );
                                    })}
                                  </Select>
                                </Form.Item>
                                {fields && fields[index] && properties[index].type === 'fixed_string' && (
                                  <Col offset={14} className="item-string-length">
                                    <Form.Item {...restField} 
                                      className="item-string-length" 
                                      name={[name, 'fixedLength']} 
                                      rules={[
                                        ...numberRulesFn(intl),
                                        {
                                          required: true,
                                          message: intl.get('formRules.numberRequired'),
                                        },
                                      ]}>
                                      <Input className="input-string-length" />
                                    </Form.Item>
                                  </Col>
                                )}
                              </Col>
                              <Col span={3}>
                                <Form.Item 
                                  name={[name, 'allowNull']} 
                                  {...restField} {...itemLayout} 
                                  valuePropName="checked">
                                  <Checkbox />
                                </Form.Item>
                              </Col>
                              <Col span={5}>
                                <Form.Item noStyle={true}>
                                  {fields &&
                                  fields[index] &&
                                  EXPLAIN_DATA_TYPE.includes(properties[index].type) ? (
                                      <Popover
                                        trigger="focus"
                                        placement="right"
                                        content={intl.getHTML(`_schema.${properties[index].type}Format`)}
                                      >
                                        <Form.Item {...restField} {...itemLayout} name={[name, 'value']}>
                                          <Input />
                                        </Form.Item>
                                      </Popover>
                                    ) : (
                                      <Form.Item {...restField} {...itemLayout} name={[name, 'value']}>
                                        <Input />
                                      </Form.Item>
                                    )}
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item {...restField} {...itemLayout} name={[name, 'comment']}>
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col span={2}>
                                <Form.Item noStyle={true}>
                                  <Button type="link" danger={true} onClick={() => handlePropertyDelete(name, remove)}>{intl.get('common.delete')}</Button>
                                </Form.Item>
                              </Col>
                            </Row>
                          </React.Fragment>
                        ))}
                      </Form.Item>
                    );
                  }}
                </Form.List>
              </div>
            );
          }}
        </Form.Item>
      </div>
    </Form.Item>
  );
};

export default observer(PropertiesForm);
