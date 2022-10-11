import { Button, Col, Form, Input, Row, Select } from 'antd';
import { FormInstance } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { nameRulesFn, numberRulesFn } from '@app/config/rules';
import Icon from '@app/components/Icon';
import { DATA_TYPE } from '@app/utils/constant';
import styles from './index.module.less';

const Option = Select.Option;

const itemLayout = {
  wrapperCol: {
    span: 23,
  },
};

interface IProps {
  formRef: FormInstance;
}

const PropertiesForm = (props: IProps) => {
  const { formRef } = props;
  const handlePropertyAdd = (callback) => {
    const properties = formRef.getFieldValue('properties');
    if (properties && properties.length > 0) {
      callback({
        name: '',
        type: '',
        fixedLength: null,
      });
    } else {
      formRef.setFieldsValue({
        properties: [
          {
            name: '',
            type: '',
            fixedLength: null,
          },
        ],
      });
    }
  };

  const handleResetValue = (index) => {
    const properties = formRef.getFieldValue('properties');
    const _properties = [...properties];
    _properties[index].fixedLength = '';
    formRef.setFieldsValue({ properties: _properties });
  };
  return (
    <Form.Item noStyle>
      <div className={styles.propertiesForm}>
        <Form.Item noStyle shouldUpdate={true}>
          {({ getFieldValue }) => {
            const properties = getFieldValue('properties') || [];
            return (
              <div>
                <Form.List name="properties">
                  {(fields, { add, remove }) => {
                    return (
                      <Form.Item noStyle>
                        <div className={styles.propertyAction}>
                          <label className={styles.label}>{intl.get('sketch.properties')}</label>
                          <Button
                            size="small"
                            type="text"
                            icon={<Icon type="icon-studio-btn-add" />}
                            className={styles.addPropertyBtn}
                            onClick={() => handlePropertyAdd(add)}
                          >
                            {intl.get('sketch.addProperty')}
                          </Button>
                        </div>
                        {fields.length > 0 && (
                          <Form.Item noStyle>
                            <Row className={styles.formHeader}>
                              <Col span={9}>{intl.get('sketch.propertyName')}</Col>
                              <Col span={12}>{intl.get('sketch.dataType')}</Col>
                            </Row>
                          </Form.Item>
                        )}
                        {fields.map(({ key, name, ...restField }, index) => (
                          <React.Fragment key={key}>
                            <Row className={styles.fieldsItem}>
                              <Col span={9}>
                                <Form.Item
                                  name={[name, 'name']}
                                  {...restField}
                                  {...itemLayout}
                                  rules={[...nameRulesFn(), () => ({ validator: (_, value) => {
                                    if (!value || properties.filter((item, i) => item.name === value && i !== index).length === 0) {
                                      return Promise.resolve();
                                    }
                                    return Promise.reject(intl.get('schema.uniqProperty'));
                                  } })]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col span={12} className={styles.propertyItem}>
                                <Form.Item
                                  name={[name, 'type']}
                                  {...restField}
                                  {...itemLayout}
                                  wrapperCol={{ span: properties[index].type === 'fixed_string' ? 15 : 23 }}
                                  rules={[
                                    {
                                      required: true,
                                      message: intl.get('formRules.dataTypeRequired'),
                                    },
                                  ]}
                                >
                                  <Select
                                    showSearch={true}
                                    onChange={() => handleResetValue(index)}
                                    dropdownMatchSelectWidth={false}
                                  >
                                    {DATA_TYPE.map((item) => {
                                      return (
                                        <Option value={item.value} key={item.value}>
                                          {item.label}
                                        </Option>
                                      );
                                    })}
                                  </Select>
                                </Form.Item>
                                {fields?.[index] && properties[index].type === 'fixed_string' && (
                                  <Form.Item
                                    {...restField}
                                    className={styles.itemStringLength}
                                    name={[name, 'fixedLength']}
                                    rules={[
                                      ...numberRulesFn(intl),
                                      {
                                        required: true,
                                        message: intl.get('formRules.numberRequired'),
                                      },
                                    ]}
                                  >
                                    <Input className={styles.inputStringLength} />
                                  </Form.Item>
                                )}
                              </Col>
                              <Col span={2}>
                                <Form.Item noStyle>
                                  <Button
                                    className={styles.removeBtn}
                                    icon={<Icon type="icon-list-close" />}
                                    onClick={() => remove(index)}
                                  />
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
