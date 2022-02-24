import { Button, Col, Form, Input, Row, message } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { nameRulesFn } from '@appv2/config/rules';
import { useHistory, useParams } from 'react-router-dom';
import { uniqBy } from 'lodash';
import GQLCodeMirror from '@appv2/components/GQLCodeMirror';
import { getTagOrEdgeCreateGQL } from '@appv2/utils/gql';
import PropertiesForm from './PropertiesForm';
import TTLForm from './TTLForm';
import './index.less';
import { useStore } from '@appv2/stores';
import { ISchemaType } from '@appv2/interfaces/schema';

const formItemLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 11,
  },
};

interface IProps {
  createType: ISchemaType
}
const ConfigCreate = (props: IProps) => {
  const { createType } = props;
  const history = useHistory();
  const { space } = useParams() as {space :string };
  const [loading, setLoading] = useState(false);
  const { schema: { createTagOrEdge } } = useStore();
  const [gql, setGql] = useState('');
  const [basicForm] = Form.useForm();

  const updateGql = () => {
    const { name, properties, ttl_col, ttl_duration, comment } = basicForm.getFieldsValue();
    const currentGQL = name
      ? getTagOrEdgeCreateGQL({
        type: createType,
        name,
        properties,
        ttl_col,
        ttl_duration,
        comment,
      })
      : '';
    setGql(currentGQL);
  };
  const handleCreate = async(values) => {
    const { name, properties } = values;
    const uniqProperties = uniqBy(properties, 'name');
    if (properties && properties.length !== uniqProperties.length) {
      return message.warning(intl.get('schema.uniqProperty'));
    } 
    setLoading(true);
    const res = await createTagOrEdge({
      gql,
      type: createType
    });
    setLoading(false);
    if (res.code === 0) {
      message.success(intl.get('schema.createSuccess'));
      history.push(`/schema/${space}/${createType}/edit/${name}`);
    }
  };
  return (
    <div className="config-form-group">
      <Form form={basicForm} 
        onFieldsChange={updateGql}
        name="basicForm" 
        className="basic-config" 
        layout="vertical" 
        onFinish={handleCreate}
        {...formItemLayout}>
        <Row className="form-item">
          <Col span={12}>
            <Form.Item label={intl.get('common.name')} name="name" rules={nameRulesFn(intl)}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={intl.get('common.comment')} name="comment">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <PropertiesForm formRef={basicForm} />
        <TTLForm formRef={basicForm} />
        <Form.Item noStyle={true}>
          <GQLCodeMirror currentGQL={gql} />
        </Form.Item>
        <Form.Item noStyle={true}>
          <div className="studio-form-footer">
            <Button onClick={() => history.push(`/schema/${space}/${createType}/list`)}>{intl.get('common.cancel')}</Button>
            <Button type="primary" loading={loading} htmlType="submit">{intl.get('common.create')}</Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default observer(ConfigCreate);
