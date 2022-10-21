import { Button, Checkbox, Col, Form, Input, Popover, Row, Select } from 'antd';
import { FormInstance } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { nameRulesFn, numberRulesFn, stringByteRulesFn } from '@app/config/rules';
import Icon from '@app/components/Icon';
import { DATA_TYPE, EXPLAIN_DATA_TYPE } from '@app/utils/constant';

const Option = Select.Option;
import styles from './index.module.less';


const itemLayout = {
  wrapperCol: {
    span: 20,
  },
};

interface IProps {
  formRef: FormInstance;
  onUpdate: () => void;
}

const PropertiesForm = (props: IProps) => {
  const { formRef, onUpdate } = props;
  const handleClearProperties = e => {
    if(!e.target.checked) {
      formRef.resetFields(['properties', []]);
      setTimeout(onUpdate, 300);
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

  const handleResetValue = (index) => {
    const properties = formRef.getFieldValue('properties');
    const _properties = [...properties];
    _properties[index].value = '';
    formRef.setFieldsValue({ 'properties': _properties });
  };
  return (
    <Form.Item noStyle>
      <div className={styles.formItem}>
        <Form.Item name="propertiesRequired" valuePropName="checked" initialValue={true}>
          <Checkbox onChange={handleClearProperties}>
            <span className={styles.label}>{intl.get('schema.defineFields')}</span>
          </Checkbox>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={true}>
          {({ getFieldValue }) => {
            const propertiesRequired = getFieldValue('propertiesRequired');
            const properties = getFieldValue('properties') || [];
            return (
              <div className={styles.boxContainer}>
                <Form.List name="properties">
                  {(fields, { add, remove }) => {
                    return (
                      <Form.Item noStyle>
                        <Form.Item noStyle>
                          <Button 
                            type="primary" 
                            className="studioAddBtn" 
                            disabled={!propertiesRequired}
                            onClick={() => handlePropertyAdd(add)}>
                            <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
                            {intl.get('common.addProperty')}
                          </Button>
                        </Form.Item>
                        <Form.Item noStyle>
                          <Row className={styles.formHeader}>
                            <Col span={4} className={styles.requiredItem}>{intl.get('common.propertyName')}</Col>
                            <Col span={6} className={styles.requiredItem}>{intl.get('common.dataType')}</Col>
                            <Col span={3}>{intl.get('common.allowNull')}</Col>
                            <Col span={5}>{intl.get('common.defaults')}</Col>
                            <Col span={4}>{intl.get('common.comment')}</Col>
                          </Row>
                        </Form.Item>
                        {fields.map(({ key, name, ...restField }, index) => (
                          <React.Fragment key={key}>
                            <Row className={styles.fieldsItem}>
                              <Col span={4}>
                                <Form.Item 
                                  name={[name, 'name']} 
                                  {...restField} 
                                  {...itemLayout} 
                                  rules={nameRulesFn()}>
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
                                  <Select showSearch={true} onChange={() => handleResetValue(index)} dropdownMatchSelectWidth={false}>
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
                                  <Col offset={14} className={styles.itemStringLength}>
                                    <Form.Item {...restField} 
                                      className={styles.itemStringLength} 
                                      name={[name, 'fixedLength']} 
                                      rules={[
                                        ...numberRulesFn(),
                                        {
                                          required: true,
                                          message: intl.get('formRules.numberRequired'),
                                        },
                                      ]}>
                                      <Input className={styles.inputStringLength} />
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
                                <Form.Item noStyle>
                                  {fields &&
                                  fields[index] &&
                                  EXPLAIN_DATA_TYPE.includes(properties[index].type) ? (
                                      <Popover
                                        trigger="focus"
                                        placement="right"
                                        content={intl.getHTML(`schema.${properties[index].type}Format`)}
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
                                <Form.Item {...restField} {...itemLayout} name={[name, 'comment']} rules={stringByteRulesFn()}>
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col span={2}>
                                <Form.Item noStyle>
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
