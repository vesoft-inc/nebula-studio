import { Button, Col, Form, Input, Row, Select, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import queryString from 'query-string';
import { nameRulesFn, stringByteRulesFn } from '@app/config/rules';
import { useHistory, useLocation } from 'react-router-dom';
import GQLCodeMirror from '@app/components/GQLCodeMirror';
import { getIndexCreateGQL } from '@app/utils/gql';
import { useStore } from '@app/stores';
import { IField, IndexType, ISchemaEnum } from '@app/interfaces/schema';
import Icon from '@app/components/Icon';
import { trackPageView } from '@app/utils/stat';
import { handleKeyword } from '@app/utils/function';
import { useI18n } from '@vesoft-inc/i18n';
import cls from 'classnames';
import FieldSelectModal from './FieldSelectModal';
import DraggableTags from './DraggableTags';
const Option = Select.Option;

import styles from './index.module.less';

interface ISelectField {
  strLength: string,
  field: string
}
const formItemLayout = {
  labelCol: {
    span: 10,
  },
  wrapperCol: {
    span: 11,
  },
};

const getFieldStr = (item: ISelectField) => {
  return `${handleKeyword(item.field)}${item.strLength ? `(${item.strLength})` : ''}`;
};
const IndexCreate = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const { intl } = useI18n();
  const { schema: { createIndex, getTags, getEdges, getTagOrEdgeInfo } } = useStore();
  const [gql, setGql] = useState('');
  const [form] = Form.useForm();
  const [typeList, setTypeList] = useState([]);
  const [fieldList, setFieldList] = useState<IField[]>([]);
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const initialType = useMemo(() => {
    const { type } = queryString.parse(location.search);
    return type;
  }, [location]);
  const updateGql = () => {
    const { name, type, associate, fields, comment } = form.getFieldsValue();
    const _fields = fields.map(i => getFieldStr(i));
    const currentGQL = name ? getIndexCreateGQL({
      type,
      name,
      associate,
      fields: _fields,
      comment,
    }) : '';
    setGql(currentGQL);
  };
  const handleCreate = async (values) => {
    const { name, type, associate, fields, comment } = values;
    const _fields = fields.map(i => getFieldStr(i));
    setLoading(true);
    const res = await createIndex({
      name,
      type,
      associate,
      fields: _fields,
      comment,
    });
    setLoading(false);
    if (res.code === 0) {
      message.success(intl.get('schema.createSuccess'));
      history.push(`/schema/index/list/${type}`);
    }
  };

  const getAssociatedList = async (type?: IndexType) => {
    const associatedType = type ? type : form.getFieldValue('type');
    const data =
      associatedType === 'tag'
        ? await getTags()
        : await getEdges();
    if (data) {
      setTypeList(data);
      form.setFieldsValue({
        associate: '',
        fields: [],
      });
    }
  };

  const getFieldList = async value => {
    const type = form.getFieldValue('type');
    const res = await getTagOrEdgeInfo(type, value);
    if (res.code === 0) {
      setFieldList(res.data.tables);
      form.setFieldsValue({
        fields: [],
      });
    }
  };

  const updateFields = (data: ISelectField[]) => {
    form.setFieldsValue({
      fields: data,
    });
    updateGql();
  };

  const removeField = (field: ISelectField) => {
    const fields = form.getFieldValue('fields');
    form.setFieldsValue({
      fields: fields.filter(i => i !== field),
    });
    updateGql();
  };
  useEffect(() => {
    trackPageView('/schema/config/index/create');
    getAssociatedList(initialType as IndexType || ISchemaEnum.Tag);
  }, []);
  return (
    <div className={styles.indexCreatePage}>
      <Form form={form} 
        onFieldsChange={updateGql}
        name="form" 
        layout="vertical" 
        onFinish={handleCreate}
        initialValues={{
          type: initialType || ISchemaEnum.Tag,
          fields: []
        }}
        {...formItemLayout}>
        <Row>
          <Col span={12}>
            <Form.Item 
              label={intl.get('schema.indexType')} 
              name="type"
              rules={[
                {
                  required: true,
                },
              ]}>
              <Select onChange={getAssociatedList}>
                <Option value="tag">Tag</Option>
                <Option value="edge">Edge Type</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item noStyle dependencies={['type']}>
              {({ getFieldValue }) => {
                const type = getFieldValue('type');
                return (
                  <Form.Item 
                    label={intl.get('schema.associateName', { type })} 
                    name="associate" 
                    rules={[
                      {
                        required: true,
                        message: intl.get('formRules.associateNameRequired', { type }),
                      },
                    ]}>
                    <Select onChange={getFieldList}>
                      {typeList.map((item, index) => (
                        <Option value={item} key={`${index}_${item}`}>
                          {item}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label={intl.get('schema.indexName')} name="name" rules={nameRulesFn()}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={intl.get('common.comment')} name="comment" rules={stringByteRulesFn()}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label={<>
          {intl.get('schema.indexFields')}
          <span>
            {intl.get('schema.dragSorting')}
          </span>
        </>} wrapperCol={{ span: 24 }}>
          <Form.Item noStyle name="fields">
            <Button 
              type="primary" 
              className={cls('studioAddBtn', styles.btnFieldAdd)} 
              onClick={() => setVisible(true)}>
              <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
              {intl.get('common.addProperty')}
            </Button>
          </Form.Item>
          <Form.Item noStyle dependencies={['fields']}>
            {({ getFieldValue }) => {
              const fields = getFieldValue('fields') || [];
              const filterList = fieldList.filter(
                item => !fields.some(field => field.field === item.Field),
              );
              return <>
                <DraggableTags
                  data={fields}
                  updateData={updateFields}
                  removeData={removeField}
                />
                <FieldSelectModal 
                  visible={visible}
                  source={filterList}
                  onClose={() => setVisible(false)}
                  onAddField={newField => updateFields([...fields, newField])}
                />
              </>;
            }}
          </Form.Item>
        </Form.Item>
        <Form.Item noStyle>
          <div className={styles.viewRow}>
            <GQLCodeMirror currentGQL={gql} />
          </div>
        </Form.Item>
        <Form.Item noStyle>
          <div className="studioFormFooter">
            <Button onClick={() => history.push(`/schema/index/list`)}>{intl.get('common.cancel')}</Button>
            <Button type="primary" loading={loading} htmlType="submit">{intl.get('common.create')}</Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default observer(IndexCreate);
