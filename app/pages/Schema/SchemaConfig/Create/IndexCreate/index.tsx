import { Button, Col, Form, Input, Row, Select, message } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { nameRulesFn } from '@app/config/rules';
import { useHistory, useParams } from 'react-router-dom';
import GQLCodeMirror from '@app/components/GQLCodeMirror';
import { getIndexCreateGQL } from '@app/utils/gql';
import { useStore } from '@app/stores';
import { IField, IndexType } from '@app/interfaces/schema';
import Icon from '@app/components/Icon';
import { trackPageView } from '@app/utils/stat';

import FieldSelectModal from './FieldSelectModal';
import DraggableTags from './DraggableTags';
const Option = Select.Option;

import './index.less';


const formItemLayout = {
  labelCol: {
    span: 10,
  },
  wrapperCol: {
    span: 11,
  },
};

const IndexCreate = () => {
  const history = useHistory();
  const { space } = useParams() as {space :string };
  const [loading, setLoading] = useState(false);
  const { schema: { createIndex, getTags, getEdges, getTagOrEdgeInfo } } = useStore();
  const [gql, setGql] = useState('');
  const [form] = Form.useForm();
  const [typeList, setTypeList] = useState([]);
  const [fieldList, setFieldList] = useState<IField[]>([]);
  const [visible, setVisible] = useState(false);
  const updateGql = () => {
    const { name, type, associate, fields, comment } = form.getFieldsValue();
    const currentGQL = name ? getIndexCreateGQL({
      type,
      name,
      associate,
      fields,
      comment,
    }) : '';
    setGql(currentGQL);
  };
  const handleCreate = async(values) => {
    const { name, type, associate, fields, comment } = values;
    setLoading(true);
    const res = await createIndex({
      name,
      type,
      associate,
      fields,
      comment,
    });
    setLoading(false);
    if (res.code === 0) {
      message.success(intl.get('schema.createSuccess'));
      history.push(`/schema/${space}/index/list/${type}`);
    }
  };

  const getAssociatedList = async(type?: IndexType) => {
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

  const updateFields = (data: string[]) => {
    form.setFieldsValue({
      fields: data,
    });
    updateGql();
  };

  const removeField = (field: string) => {
    const fields = form.getFieldValue('fields');
    form.setFieldsValue({
      fields: fields.filter(i => i !== field),
    });
    updateGql();
  };
  useEffect(() => {
    trackPageView('/schema/config/index/create');
    getAssociatedList('tag');
  }, []);
  return (
    <div className="index-create-page">
      <Form form={form} 
        onFieldsChange={updateGql}
        name="form" 
        className="index-config" 
        layout="vertical" 
        onFinish={handleCreate}
        initialValues={{
          type: 'tag',
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
            <Form.Item noStyle={true} dependencies={['type']}>
              {({ getFieldValue }) => {
                const type = getFieldValue('type');
                return (
                  <Form.Item 
                    label={intl.get('schema.associateName', { type })} 
                    name="associate" 
                    rules={[
                      {
                        required: true,
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
            <Form.Item label={intl.get('schema.indexName')} name="name" rules={nameRulesFn(intl)}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={intl.get('common.comment')} name="comment">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label={<>
          {intl.get('schema.indexFields')}
          <span className="tip-draggable">
            {intl.get('schema.dragSorting')}
          </span>
        </>}>
          <Form.Item noStyle={true} name="fields">
            <Button 
              type="primary" 
              className="studio-add-btn btn-field-add" 
              onClick={() => setVisible(true)}>
              <Icon className="studio-add-btn-icon" type="icon-btn-add" />
              {intl.get('common.addProperty')}
            </Button>
          </Form.Item>
          <Form.Item noStyle={true} dependencies={['fields']}>
            {({ getFieldValue }) => {
              const fields = getFieldValue('fields') || [];
              const filterList = fieldList.filter(
                item => !fields.some(field => field.startsWith(item.Field)),
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
        <Form.Item noStyle={true}>
          <div className="view-row">
            <GQLCodeMirror currentGQL={gql} />
          </div>
        </Form.Item>
        <Form.Item noStyle={true}>
          <div className="studio-form-footer">
            <Button onClick={() => history.push(`/schema/${space}/index/list`)}>{intl.get('common.cancel')}</Button>
            <Button type="primary" loading={loading} htmlType="submit">{intl.get('common.create')}</Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default observer(IndexCreate);
