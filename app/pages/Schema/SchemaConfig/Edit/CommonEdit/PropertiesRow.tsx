import { Button, Checkbox, Col, Form, Input, Popconfirm, Popover, Row, Select } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { AlterType, IProperty } from '@app/interfaces/schema';
import { nameRulesFn, numberRulesFn } from '@app/config/rules';
import { DATA_TYPE, EXPLAIN_DATA_TYPE } from '@app/utils/constant';

import './index.less';
const Option = Select.Option;

interface IEditProperty extends IProperty {
  alterType: AlterType
}

interface IProps {
  data: IProperty;
  onEditBefore: (data: IProperty) => void;
  onDelete: (data: IProperty[]) => void;
  disabled: boolean
}
interface IEditProps {
  data: IEditProperty | null;
  onEditCancel: () => void;
}

export const DisplayRow = (props: IProps) => {
  const { data, onEditBefore, onDelete, disabled } = props;
  return <Row className="fields-item">
    <Col span={4}>
      {data.name}
    </Col>
    <Col span={6}>
      {data.showType}
    </Col>
    <Col span={2}>
      <Checkbox checked={data.allowNull} disabled={true} />
    </Col>
    <Col span={5}>
      {data.value?.toString()}
    </Col>
    <Col span={4}>
      {data.comment}
    </Col>
    <Col span={3} className="operations">
      <Button
        type="link"
        onClick={() => onEditBefore(data)}
        disabled={disabled}
      >
        {intl.get('common.edit')}
      </Button>
      <Popconfirm
        onConfirm={() => {
          onDelete([data]);
        }}
        title={intl.get('common.ask')}
        okText={intl.get('common.ok')}
        cancelText={intl.get('common.cancel')}
      >
        <Button
          type="link"
          disabled={disabled}
        >
          {intl.get('common.delete')}
        </Button>
      </Popconfirm>
    </Col>
  </Row>;
};

export const EditRow = (props: IEditProps) => {
  const { data, onEditCancel } = props;
  if(!data) {
    return null;
  }
  const { alterType, name, type, fixedLength, allowNull, value, comment } = data;
  return (
    <Form.Item noStyle={true} shouldUpdate={true}>
      {({ getFieldValue }) => {
        const currentType = getFieldValue('type');
        return (
          <Row className="fields-item">
            <Col span={4}>
              <Form.Item 
                name="name"
                initialValue={name} 
                rules={nameRulesFn(intl)}>
                <Input disabled={alterType !== 'ADD'} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item 
                name="type"
                wrapperCol={{ span: 14 }}
                initialValue={type}  
                rules={[
                  {
                    required: true,
                    message: intl.get('formRules.dataTypeRequired'),
                  },
                ]}>
                <Select className="select-type" showSearch={true} dropdownMatchSelectWidth={false}>
                  {DATA_TYPE.map(item => {
                    return (
                      <Option value={item.value} key={item.value}>
                        {item.label}
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
              <Col offset={14} className="item-string-length">
                {currentType === 'fixed_string' && <Form.Item  
                  className="item-string-length" 
                  name="fixedLength"
                  initialValue={fixedLength}
                  rules={[
                    ...numberRulesFn(intl),
                    {
                      required: true,
                      message: intl.get('formRules.numberRequired'),
                    },
                  ]}>
                  <Input className="input-string-length" />
                </Form.Item>}
              </Col>
            </Col>
            <Col span={2}>
              <Form.Item 
                name="allowNull"
                initialValue={allowNull}
                valuePropName="checked">
                <Checkbox />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item noStyle={true}>
                {EXPLAIN_DATA_TYPE.includes(type) ? (
                  <Popover
                    trigger="focus"
                    placement="right"
                    content={intl.getHTML(`_schema.${type}Format`)}
                  >
                    <Form.Item name="value" initialValue={value}>
                      <Input />
                    </Form.Item>
                  </Popover>
                ) : (
                  <Form.Item name="value" initialValue={value}>
                    <Input />
                  </Form.Item>
                )}
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="comment" initialValue={comment}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={3} className="operations">
              <Form.Item noStyle={true}>
                <Button
                  type="link"
                  htmlType="submit"
                >
                  {intl.get('common.ok')}
                </Button>
                <Button
                  type="link"
                  onClick={onEditCancel}
                >
                  {intl.get('common.cancel')}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        );
      }}
    </Form.Item>
  );
};