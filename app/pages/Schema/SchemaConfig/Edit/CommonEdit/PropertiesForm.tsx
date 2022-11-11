import { Button, Checkbox, Col, Form, Modal, Row, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Icon from '@app/components/Icon';
import { AlterType, IAlterForm, IProperty, ISchemaType } from '@app/interfaces/schema';
import { useI18n } from '@vesoft-inc/i18n';
import { DisplayRow, EditRow } from './PropertiesRow';
import styles from './index.module.less';
const confirm = Modal.confirm;

interface IProps {
  editType: ISchemaType
  initialRequired: boolean;
  data: any;
  editDisabled: boolean;
  onBeforeEdit: (index: number | null) => void;
  onEdit: (config: IAlterForm) => void;
}

interface IEditProperty extends IProperty {
  alterType: AlterType
}
const itemLayout = {
  wrapperCol: {
    span: 20,
  },
};

const PropertiesForm = (props: IProps) => {
  const { 
    editType, 
    initialRequired, 
    data: { name, properties, ttlConfig }, 
    editDisabled,
    onEdit, 
    onBeforeEdit } = props;
  const { intl } = useI18n();
  const [list, setList] = useState<IProperty[]>(properties);
  const [editField, setEditField] = useState<IEditProperty | null>(null);
  const [editRow, setEditRow] = useState<number | null>(null);
  const [propertyRequired, setPropertyRequired] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => {
    setList(properties);
    setEditRow(null);
    setEditField(null);
  }, [properties]);
  useEffect(() => {
    setPropertyRequired(initialRequired);
  }, [initialRequired]);
  
  useEffect(() => {
    form.resetFields();
  }, [editField]);
  const handleClearProperties = e => {
    const clear = e.target.checked;
    if(clear) {
      setPropertyRequired(clear);
      handlePropertyAdd();
    } else {
      confirm({
        title: intl.get('schema.cancelOperation'),
        content: intl.get('schema.cancelPropmt'),
        okText: intl.get('common.yes'),
        cancelText: intl.get('common.no'),
        onOk: () => {
          setPropertyRequired(clear);
          if (properties.length > 0) {
            handlePropertyDelete(properties);
          }
        },
      });
    }
  };

  const handlePropertyAdd = () => {
    const editField: IEditProperty = {
      name: '',
      type: '',
      value: '',
      comment: '',
      allowNull: true,
      fixedLength: '',
      alterType: 'ADD',
    };
    setList([...list, editField]);
    setEditField(editField);
    setEditRow(list.length);
    onBeforeEdit(list.length);
  };


  const handlePropertyDelete = async (fields: IProperty[]) => {
    onEdit({
      type: editType,
      name,
      action: 'DROP',
      config: {
        fields,
      },
    });
  };

  const handleEditBefore = (data: IProperty, index: number) => {
    if (ttlConfig && ttlConfig.col === data.name) {
      return message.warning(intl.get('schema.fieldDisabled'));
    }
    const editField = {
      ...data,
      alterType: 'CHANGE' as AlterType,
    };
    setEditField(editField);
    setEditRow(index);
    onBeforeEdit(index);
  };

  const handleEditCancel = () => {
    setEditRow(null);
    setEditField(null);
    onBeforeEdit(null);
    if (editField?.alterType === 'ADD') {
      setList(list.slice(0, -1));
      if(list.length === 1) {
        setPropertyRequired(false);
      }
    }
  };
  
  const handlePropertyUpdate = (values) => {
    const { name: propertyName, type, value, comment, allowNull, fixedLength } = values;
    const { alterType } = editField!;
    onEdit({
      type: editType,
      name,
      action: alterType,
      config: {
        fields: [{
          name: propertyName,
          type,
          value,
          comment,
          allowNull,
          fixedLength
        }],
      },
    });
  };

  const handleResetValue = () => {
    form.setFieldsValue({ value: '' });
  };
  return (
    <Form 
      form={form} 
      className={styles.formItem}
      {...itemLayout}
      onFinish={handlePropertyUpdate}>
      <Form.Item>
        <Checkbox disabled={editDisabled} checked={propertyRequired} onChange={handleClearProperties}>
          <span className={styles.label}>{intl.get('schema.defineFields')}</span>
        </Checkbox>
      </Form.Item>
      <Form.Item noStyle shouldUpdate={true}>
        <div className={styles.boxContainer}>
          <Form.Item noStyle>
            <Button 
              type="primary" 
              className="studioAddBtn" 
              disabled={!propertyRequired || editDisabled || editField !== null}
              onClick={handlePropertyAdd}>
              <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
              {intl.get('common.addProperty')}
            </Button>
          </Form.Item>
          <Form.Item noStyle>
            <Row className={styles.formHeader}>
              <Col span={4} className={styles.requiredItem}>{intl.get('common.propertyName')}</Col>
              <Col span={6} className={styles.requiredItem}>{intl.get('common.dataType')}</Col>
              <Col span={2}>{intl.get('common.allowNull')}</Col>
              <Col span={5}>{intl.get('common.defaults')}</Col>
              <Col span={4}>{intl.get('common.comment')}</Col>
            </Row>
          </Form.Item>
          {list.map((item, index) => {
            return editRow === index 
              ? <EditRow key={index} data={editField} onUpdateType={handleResetValue} onEditCancel={handleEditCancel} /> 
              : <DisplayRow
                key={index}
                data={item}
                disabled={editDisabled}
                onDelete={handlePropertyDelete}
                onEditBefore={(item) => handleEditBefore(item, index)}
              />;
          })}
        </div>
      </Form.Item>
    </Form>
  );
};

export default observer(PropertiesForm);
