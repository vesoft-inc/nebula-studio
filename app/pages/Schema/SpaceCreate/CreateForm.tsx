import { Col, Form, Input, Row, Select, FormProps } from 'antd';
import React, { useMemo } from 'react';
import { useStore } from '@app/stores';
import { nameRulesFn, numberRulesFn, replicaRulesFn, stringByteRulesFn } from '@app/config/rules';
import { useI18n } from '@vesoft-inc/i18n';
import { DEFAULT_PARTITION_NUM } from '@app/utils/constant';
import styles from './index.module.less';
const Option = Select.Option;


const defaultFormItemLayout = {
  labelCol: {
    span: 10,
  },
  wrapperCol: {
    span: 11,
  },
};
interface IProps extends FormProps {
  className?: string;
  formItemLayout?: typeof defaultFormItemLayout;
  activeMachineNum: number;
  colSpan: 'full' | 'half';
}

const CreateForm = (props: IProps) => {
  const { onFieldsChange, onFinish, className, formItemLayout, form, colSpan } = props;
  const { intl } = useI18n();
  const { schema } = useStore();
  const { activeMachineNum } = schema;
  const _colSpan = useMemo(() => colSpan === 'full' ? 24 : 12, [colSpan]);
  const vidColSpans = useMemo(() => {
    if(colSpan === 'full') {
      return [14, 9];
    } else {
      return [formItemLayout.wrapperCol.span || 11, 11];
    }
  }, [colSpan]);
  return (
    <Form 
      className={className || styles.spaceForm} 
      form={form} 
      layout="vertical" 
      onFieldsChange={onFieldsChange} 
      onFinish={onFinish} 
      {...defaultFormItemLayout} {...formItemLayout}>
      <Row>
        <Col span={_colSpan}>
          <Form.Item label={intl.get('common.name')} name="name" rules={nameRulesFn()}>
            <Input placeholder={intl.get('schema.spaceNameEnter')} />
          </Form.Item>
        </Col>
        <Col span={_colSpan} className={styles.vidItem}>
          <Form.Item noStyle shouldUpdate={true}>
            {({ getFieldValue }) => {
              const vidType = getFieldValue('vidType');
              return <>
                <Form.Item
                  label="Vid Type"
                  name="vidType"
                  rules={[{ required: true, message: intl.get('formRules.vidTypeRequired') }]}
                  wrapperCol={vidType === 'FIXED_STRING' && { span: vidColSpans[0] }}
                >
                  <Select placeholder={intl.get('schema.selectVidTypeTip')}>
                    <Option value="FIXED_STRING">FIXED_STRING</Option>
                    <Option value="INT64">INT64</Option>
                  </Select>
                </Form.Item>
                {vidType === 'FIXED_STRING' 
                  ? <Col span={vidColSpans[1]} offset={vidColSpans[0] + 1} className={styles.stringLength}>
                    <Form.Item label={intl.get('schema.length')} name="stringLength" rules={[
                      {
                        required: true,
                        message: intl.get('formRules.fixStringLengthRequired'),
                      },
                      ...numberRulesFn(),
                    ]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  : null}
              </>;
            }}
          </Form.Item>
        
        </Col>
      </Row>
      <Row>
        <Col span={_colSpan}>
          <Form.Item label={<span>
            {intl.get('common.comment')}:
            <span className={styles.optionalItem}>({intl.get('common.optional')})</span>
          </span>} name="comment" rules={stringByteRulesFn()}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={_colSpan}>
          <Form.Item
            colon={false}
            label={<span>
              Partition_num:
              <span className={styles.optionalItem}>({intl.get('common.optional')})</span>
            </span>}
            name="partitionNum"
            rules={numberRulesFn()}
          >
            <Input placeholder={DEFAULT_PARTITION_NUM.toString()} />
          </Form.Item>
        </Col>
        <Col span={_colSpan}>
          <Form.Item
            colon={false}
            label={<span>
              Replica_factor:
              <span className={styles.optionalItem}>({intl.get('common.optional')})</span>
            </span>}
            name="replicaFactor"
            rules={replicaRulesFn(activeMachineNum)}
          >
            <Input placeholder="1" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default CreateForm;
