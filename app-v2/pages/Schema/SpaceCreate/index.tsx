import { Button, Col, Form, Input, Row, Select, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '@appv2/components/Breadcrumb';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import { trackPageView } from '@appv2/utils/stat';
import { nameRulesFn, numberRulesFn, replicaRulesFn } from '@appv2/config/rules';
import { getSpaceCreateGQL } from '@appv2/utils/gql';
import GQLCodeMirror from '@appv2/components/GQLCodeMirror';
import intl from 'react-intl-universal';
import './index.less';
import { useHistory } from 'react-router-dom';
import FormItem from 'antd/lib/form/FormItem';
const Option = Select.Option;

function getVidType(type: string, length?: string) {
  let result;
  if (type === 'INT64') {
    result = type;
  } else if (type === 'FIXED_STRING') {
    result = type + '(' + (length || '') + ')';
  }
  return result;
}

const formItemLayout = {
  labelCol: {
    span: 10,
  },
  wrapperCol: {
    span: 11,
  },
};

const SpaceCreate = () => {
  const [form] = Form.useForm();
  const { schema } = useStore();
  const { createSpace, getMachineNumber, activeMachineNum } = schema;
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [gql, setGql] = useState('');
  const routes = useMemo(() => [
    {
      path: '/schema',
      breadcrumbName: intl.get('_schema.spaceList'),
    },
    {
      path: '#',
      breadcrumbName: intl.get('_schema.createSpace'),
    },
  ], []);

  const handleCreate = () => {
    setLoading(true);
    form.validateFields().then(async() => {
      const { code, message: errorMsg } = await createSpace(gql);
      setLoading(false);
      if (code === 0) {
        history.push('/schema');
        message.success(intl.get('schema.createSuccess'));
      } else {
        message.warning(errorMsg);
      }
    }).catch(_ => {
      setLoading(false);
    });
  };

  const updateGql = () => {
    const {
      name,
      partitionNum,
      replicaFactor,
      vidType,
      stringLength,
      comment,
    } = form.getFieldsValue();
    if(name) {
      const _vidType = getVidType(vidType, stringLength);
      const options = {
        partition_num: partitionNum,
        replica_factor: replicaFactor,
        vid_type: _vidType,
      };
      setGql(getSpaceCreateGQL({
        name,
        options,
        comment
      }));
    } else {
      setGql('');
    }
  };
  useEffect(() => {
    trackPageView('/space/create');
    getMachineNumber();
  }, []);
  return (
    <div className="nebula-space-page">
      <Breadcrumb routes={routes} />
      <div className="config-container center-layout">
        <Form className="space-form" form={form} layout="vertical" onFieldsChange={updateGql} {...formItemLayout}>
          <Row>
            <Col span={12}>
              <Form.Item label={intl.get('common.name')} name="name" rules={nameRulesFn(intl)}>
                <Input placeholder={intl.get('_schema.spaceNameEnter')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Vid Type"
                name="vidType"
                rules={[{ required: true }]}
              >
                <Select placeholder="FIXED_STRING" className="select-vid-type">
                  <Option value="FIXED_STRING">FIXED_STRING</Option>
                  <Option value="INT64">INT64</Option>
                </Select>
              </Form.Item>
              <FormItem noStyle={true} dependencies={['vidType']}>
                {({ getFieldValue }) => {
                  const vidType = getFieldValue('vidType');
                  return vidType === 'FIXED_STRING' ? <Form.Item className="item-string-length" name="stringLength" rules={[
                    {
                      required: true,
                      message: 'fix string length limit is required',
                    },
                    ...numberRulesFn(intl),
                  ]}>
                    <Input />
                  </Form.Item>
                    : null;
                }}
              </FormItem>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item label={intl.get('common.comment')} name="comment">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item
                colon={false}
                label={<span className="form-label">
                  Partition_num:
                  <span className="optional-item">({intl.get('common.optional')})</span>
                </span>}
                name="partitionNum"
                rules={numberRulesFn(intl)}
              >
                <Input placeholder="100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                colon={false}
                label={<span className="form-label">
                  Replica_factor:
                  <span className="optional-item">({intl.get('common.optional')})</span>
                </span>}
                name="replicaFactor"
                rules={replicaRulesFn(intl, activeMachineNum)}
              >
                <Input placeholder="1" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <GQLCodeMirror currentGQL={gql} />
      </div>
      <div className="footer">
        <Button onClick={() => history.push('/schema')}>{intl.get('common.cancel')}</Button>
        <Button type="primary" loading={loading} onClick={handleCreate}>{intl.get('common.create')}</Button>
      </div>
    </div>
  );
};

export default observer(SpaceCreate);
