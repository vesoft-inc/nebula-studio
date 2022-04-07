import { Button, Col, Form, Input, Row, Select, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '@app/components/Breadcrumb';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { nameRulesFn, numberRulesFn, replicaRulesFn } from '@app/config/rules';
import { getSpaceCreateGQL } from '@app/utils/gql';
import GQLCodeMirror from '@app/components/GQLCodeMirror';
import intl from 'react-intl-universal';
import cls from 'classnames';
import { useHistory } from 'react-router-dom';
import FormItem from 'antd/lib/form/FormItem';
import Cookie from 'js-cookie';
import styles from './index.module.less';
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
      breadcrumbName: intl.get('schema.spaceList'),
    },
    {
      path: '#',
      breadcrumbName: intl.get('schema.createSpace'),
    },
  ], [Cookie.get('lang')]);

  const handleCreate = () => {
    setLoading(true);
    form.validateFields().then(async () => {
      const { code } = await createSpace(gql);
      setLoading(false);
      if (code === 0) {
        history.push('/schema');
        message.success(intl.get('schema.createSuccess'));
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
    trackPageView('/schema/space/create');
    getMachineNumber();
  }, []);
  return (
    <div className={styles.spaceCreate}>
      <Breadcrumb routes={routes} />
      <div className={cls(styles.configContainer, 'studioCenterLayout')}>
        <Form className={styles.spaceForm} form={form} layout="vertical" onFieldsChange={updateGql} {...formItemLayout}>
          <Row>
            <Col span={12}>
              <Form.Item label={intl.get('common.name')} name="name" rules={nameRulesFn()}>
                <Input placeholder={intl.get('schema.spaceNameEnter')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Vid Type"
                name="vidType"
                rules={[{ required: true }]}
              >
                <Select placeholder={intl.get('schema.selectVidTypeTip')}>
                  <Option value="FIXED_STRING">FIXED_STRING</Option>
                  <Option value="INT64">INT64</Option>
                </Select>
              </Form.Item>
              <FormItem noStyle dependencies={['vidType']}>
                {({ getFieldValue }) => {
                  const vidType = getFieldValue('vidType');
                  return vidType === 'FIXED_STRING' ? <Col offset={11} className={styles.stringLength}>
                    <Form.Item label={intl.get('schema.length')} name="stringLength" rules={[
                      {
                        required: true,
                        message: 'fix string length limit is required',
                      },
                      ...numberRulesFn(),
                    ]}>
                      <Input />
                    </Form.Item>
                  </Col>
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
                label={<span>
                  Partition_num:
                  <span className={styles.optionalItem}>({intl.get('common.optional')})</span>
                </span>}
                name="partitionNum"
                rules={numberRulesFn()}
              >
                <Input placeholder="100" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
        <GQLCodeMirror currentGQL={gql} />
      </div>
      <div className="studioFormFooter">
        <Button onClick={() => history.push('/schema')}>{intl.get('common.cancel')}</Button>
        <Button type="primary" loading={loading} onClick={handleCreate}>{intl.get('common.create')}</Button>
      </div>
    </div>
  );
};

export default observer(SpaceCreate);
