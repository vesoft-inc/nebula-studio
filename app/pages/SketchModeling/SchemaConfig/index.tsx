import Icon from '@app/components/Icon';
import { Button, Form, Input } from 'antd';
import intl from 'react-intl-universal';
import { useStore } from '@app/stores';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import { nameRulesFn } from '@app/config/rules';
import { debounce } from 'lodash';
import { ISchemaEnum } from '@app/interfaces/schema';
import PropertiesForm from './PropertiesForm';
import styles from './index.module.less';

let flag = false;

const SchemaConfig: React.FC = () => {
  const { sketchModel } = useStore();
  const { active, updateItem, deleteElement, duplicateNode } = sketchModel;
  const [form] = Form.useForm();
  const update = useCallback((data) => {
    if (!sketchModel.active) {
      return;
    }

    const { editor, active } = sketchModel;
    updateItem(active, data);
    if (sketchModel.active.type === ISchemaEnum.Tag) {
      editor.graph.node.updateNode(editor.graph.node.nodes[active.uuid].data, true);
    } else {
      editor.graph.line.updateLine(editor.graph.line.lines[active.uuid].data, true);
    }
  }, []);

  const validateSameName = () => {
    const prevName = sketchModel.active?.name;
    const name = form.getFieldValue('name');
    const data = sketchModel.editor.schema.getData();
    let invalid = false;
    data.nodes.forEach((item) => {
      if(item.uuid === sketchModel.active?.uuid || !name) {
        return;
      }
      if(item.name === name) {
        invalid = true;
        item.invalid = true;
        sketchModel.editor.graph.node.updateNode(item, true);
      } else if (item.name === prevName) {
        item.invalid = false;
        sketchModel.editor.graph.node.updateNode(item, true);
      }
    });
    data.lines.forEach((item) => {
      if(item.uuid === sketchModel.active?.uuid || !name) {
        return;
      }
      if(item.name === name) {
        invalid = true;
        item.invalid = true;
        sketchModel.editor.graph.line.updateLine(item, true);
      } else if (item.name === prevName) {
        item.invalid = false;
        sketchModel.editor.graph.line.updateLine(item, true);
      }
    });
    invalid && form.setFields([{ name: 'name', errors: [intl.get('sketch.uniqName')] }]);
    return invalid;
  };
  const handleUpdate = useCallback(
    debounce((_, allValues) => {
      const formValues = form.getFieldsValue();
      !flag && form.validateFields();
      flag = !flag;
      const hasSameName = validateSameName();
      const hasError = allValues.some((item) => item.errors.length > 0);
      update({ ...formValues, invalid: hasError || hasSameName });
    }, 300),
    []
  );
  const handleDelete = useCallback(() => {
    deleteElement(active.type);
  }, [active]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const { name, comment, properties, invalid } = active;
    form.setFieldsValue({ name, comment, properties });
    if(invalid) {
      validateSameName();
      form.validateFields();
    }
  }, [active]);

  if (!active) {
    return null;
  }

  const { type, name, comment, properties } = active;

  return (
    <div className={styles.schemaConfig}>
      <div className={styles.actions}>
        {type === ISchemaEnum.Tag && (
          <Button onClick={duplicateNode} icon={<Icon type="icon-Duplicate" />}>
            {intl.get('common.duplicate')}
          </Button>
        )}
        <Button onClick={handleDelete} icon={<Icon type="icon-snapshot-delete" />}>
          {intl.get('common.delete')}
        </Button>
      </div>
      <Form
        form={form}
        className={styles.configForm}
        initialValues={{ name, comment, properties }}
        onFieldsChange={handleUpdate}
        name="form"
        layout="vertical"
      >
        <Form.Item noStyle>
          <div className={styles.basic}>
            <label className={styles.label}>{intl.get(`sketch.${type}`)}</label>
            <Form.Item
              label={intl.get('sketch.name', { name: intl.get(`sketch.${type}`) })}
              name="name"
              rules={nameRulesFn()}
            >
              <Input />
            </Form.Item>
            <Form.Item label={intl.get('sketch.comment')} name="comment">
              <Input />
            </Form.Item>
          </div>
        </Form.Item>
        <PropertiesForm formRef={form} />
      </Form>
    </div>
  );
};

export default observer(SchemaConfig);
