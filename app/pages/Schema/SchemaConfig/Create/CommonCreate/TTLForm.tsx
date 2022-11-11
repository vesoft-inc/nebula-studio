import { Checkbox, Col, Form, Input, Row, Select } from 'antd';
import { FormInstance } from 'antd/lib/form';
import React from 'react';
import { observer } from 'mobx-react-lite';

import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';
const Option = Select.Option;

const innerItemLayout = {
  labelCol: {
    span: 24,
  },
  wrapperCol: {
    span: 14,
  },
};

interface IProps {
  formRef: FormInstance;
  onUpdate: () => void;
}

const formRef = ((props: IProps) => {
  const { formRef, onUpdate } = props;
  const { intl } = useI18n();
  const handleClearTtl = e => {
    if(!e.target.checked) {
      formRef.resetFields(['ttl_col', '']);
      formRef.resetFields(['ttl_duration', '']);
      setTimeout(onUpdate, 300);
    }
  };
  return (
    <Form.Item noStyle>
      <div className={styles.formItem}>
        <Form.Item name="ttlRequired" valuePropName="checked" initialValue={false}>
          <Checkbox onChange={handleClearTtl}>
            <span className={styles.label}>{intl.get('schema.setTTL')}</span>
          </Checkbox>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={true}>
          {({ getFieldValue }) => {
            const properties = getFieldValue('properties') || [];
            const ttlRequired = getFieldValue('ttlRequired');
            const ttlOptions = properties.filter(i =>
              ['int', 'int64', 'timestamp'].includes(i.type),
            );
            return (
              <div className={styles.boxContainer}>
                <Row>
                  <Col span={12}>
                    <Form.Item className={styles.inlineItem} label={<>
                      <span>TTL_COL</span>
                      <span className={styles.labelTip}>({intl.get('formRules.ttlLimit')})</span>
                    </>} {...innerItemLayout} name="ttl_col" rules={[
                      {
                        required: ttlRequired,
                        message: intl.get('formRules.ttlRequired'),
                      },
                    ]}>
                      <Select disabled={!ttlRequired}>
                        {ttlOptions.map(i => (
                          <Option value={i.name} key={i.name}>
                            {i.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item className={styles.inlineItem} label="TTL_DURATION" {...innerItemLayout} name="ttl_duration" rules={[
                      {
                        required: ttlRequired,
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
                </Row>
              </div>
            );
          }}
        </Form.Item>
      </div>
    </Form.Item>
  );
});

export default observer(formRef);
