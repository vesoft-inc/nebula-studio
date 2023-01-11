import { Button, Form, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import Breadcrumb from '@app/components/Breadcrumb';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { getSpaceCreateGQL } from '@app/utils/gql';
import GQLCodeMirror from '@app/components/GQLCodeMirror';
import { useI18n } from '@vesoft-inc/i18n';
import cls from 'classnames';
import { useHistory } from 'react-router-dom';
import Cookie from 'js-cookie';
import { DEFAULT_PARTITION_NUM } from '@app/utils/constant';
import styles from './index.module.less';
import CreateForm from './CreateForm';

export function getVidType(type: string, length?: string) {
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
  const { intl } = useI18n();
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
        partition_num: partitionNum || DEFAULT_PARTITION_NUM,
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
        <CreateForm 
          form={form}
          colSpan="half"
          onFieldsChange={updateGql} 
          className={styles.spaceForm} 
          formItemLayout={formItemLayout} 
          activeMachineNum={activeMachineNum}
        />
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
