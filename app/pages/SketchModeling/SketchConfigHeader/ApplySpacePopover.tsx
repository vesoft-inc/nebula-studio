import { Popover, Radio, Button, Form, Select, message } from 'antd';
import React, { useCallback, useState } from 'react';
import intl from 'react-intl-universal';
import CreateForm from '@app/pages/Schema/SpaceCreate/CreateForm';
import { useStore } from '@app/stores';
import { ExclamationCircleTwoTone } from '@ant-design/icons';
import { intersection } from 'lodash';
import { getSpaceCreateGQL, getTagOrEdgeCreateGQL } from '@app/utils/gql';
import { ISketchEdge, ISketchNode } from '@app/interfaces/sketch';
import { useHistory } from 'react-router-dom';
import { getVidType } from '@app/pages/Schema/SpaceCreate';
import styles from './index.module.less';

const Option = Select.Option;
const formItemLayout = {
  labelCol: {
    span: 24,
  },
  wrapperCol: {
    span: 24,
  },
};

interface IContentProps {
  close: () => void;
}

const getSchemaInfo = (data) => {
  const tags = data.nodes.map(item => ({
    name: item.name,
    comment: item.comment,
    properties: item.properties,
    type: item.type
  }));
  const edges = data.lines.map(item => ({
    name: item.name,
    comment: item.comment,
    properties: item.properties,
    type: item.type
  }));
  return { tags, edges };
};

const getCreateGql = (data: ISketchNode | ISketchEdge) => {
  const { name, comment, properties, type } = data;
  return getTagOrEdgeCreateGQL({
    type,
    name,
    comment,
    properties
  });
};

const PopoverContent = (props: IContentProps) => {
  const { close } = props;
  const [mode, setMode] = useState('create' as 'create' | 'apply');
  const [spaces, setSpaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const history = useHistory();
  const {
    schema,
    sketchModel
  } = useStore();
  const { getMachineNumber, getSpaces, updateSpaceInfo } = schema;
  const handleChangeMode = useCallback(async (e: any) => {
    const { value } = e.target;
    setMode(value);
    if (value === 'create') {
      getMachineNumber();
    } else {
      const { code, data } = await getSpaces();
      code === 0 && setSpaces(data);
    }
  }, []);

  const switchSpaceAndApply = useCallback(async (space, schemaInfo) => {
    const err = await schema.switchSpace(space, true);
    if (!err) {
      batchApplySchema(schemaInfo);
    } else if (err && err.toLowerCase().includes('spacenotfound')) {
      setTimeout(() => switchSpaceAndApply(space, schemaInfo), 1200);
    } else {
      setLoading(false);
      return;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    form.validateFields().then(async (values) => {
      const data = sketchModel.editor?.schema?.getData();
      const schemaInfo = getSchemaInfo(data);
      if (mode === 'create') {
        setLoading(true);
        const res = await handleCreateSpace(values);
        if (res.code !== 0) {
          setLoading(false);
          return;
        }
        switchSpaceAndApply(values.name, schemaInfo);
      } else {
        const { space } = values;
        await updateSpaceInfo(space);
        const hasIntersection = checkSchemaIntersection(schemaInfo);
        if(hasIntersection) {
          close();
          return;
        }
        setLoading(true);
        batchApplySchema(schemaInfo);
      }
    });
  }, [mode]);

  const checkSchemaIntersection = useCallback((schemaInfo) => {
    const { tags, edgeTypes } = schema;
    const { tags: newTags, edges: newEdges } = schemaInfo;
    const sameTags = intersection(newTags.map(item => item.name), tags);
    const sameEdges = intersection(newEdges.map(item => item.name), edgeTypes);
    if(!sameTags.length && !sameEdges.length) {
      return true;
    }
    const tagStr = sameTags.join('、');
    const edgeStr = sameEdges.join('、');
    let content = '';
    let hasType = '';
    if(tagStr) {
      content = intl.get('common.tag') + ` (${tagStr}) `;
      hasType = intl.get('common.tag');
    }
    if(edgeStr) {
      content += `${content ? ' / ' : ''}` + intl.get('common.edge') + ` (${edgeStr}) `;
      hasType += `${hasType ? ' / ' : ''}` + intl.get('common.edge');
    }
    message.warning(intl.get('sketch.sameSchemaWarning', { content, hasType }));
    return false;
  }, []);

  const handleCreateSpace = useCallback(async (data) => {
    const { 
      name,
      partitionNum,
      replicaFactor,
      vidType,
      stringLength,
      comment
    } = data;
    const _vidType = getVidType(vidType, stringLength);
    const options = {
      partition_num: partitionNum,
      replica_factor: replicaFactor,
      vid_type: _vidType,
    };
    const gql = getSpaceCreateGQL({
      name,
      options,
      comment
    });
    const res = await schema.createSpace(gql);
    return res;
  }, []);

  const batchApplySchema = useCallback(async (schema) => {
    const { tags, edges } = schema;
    const gql = tags.map(tag => getCreateGql(tag)).concat(edges.map(edge => getCreateGql(edge))).join(';');
    const { code } = await sketchModel.batchApply(gql);
    setLoading(false);
    if(code === 0) {
      message.success(intl.get('schema.createSuccess'));
      setTimeout(() => {
        history.push('/schema/tag/list');
      }, 600);
    }
  }, []);
  return (
    <>
      <Radio.Group className={styles.radioTabs} onChange={handleChangeMode} value={mode} buttonStyle="solid">
        <Radio.Button value="create">{intl.get('sketch.createSpace')}</Radio.Button>
        <Radio.Button value="apply">{intl.get('sketch.selectSpace')}</Radio.Button>
      </Radio.Group>
      {mode === 'create' ? (
        <CreateForm form={form} activeMachineNum={1} colSpan="full" formItemLayout={formItemLayout} />
      ) : (
        <Form className={styles.applyForm} form={form} {...formItemLayout}>
          <Form.Item
            label={intl.get('console.selectSpace')}
            name="space"
            rules={[{ required: true, message: intl.get('formRules.spaceRequired') }]}
          >
            <Select>
              {spaces.map((space) => (
                <Option value={space} key={space}>
                  {space}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={false}>
            <div className={styles.applyTips}>
              <ExclamationCircleTwoTone />
              <span>{intl.get('sketch.applySpaceTip')}</span>
            </div>
          </Form.Item>
        </Form>
      )}
      <div className={styles.formFooter}>
        <Button onClick={close}>{intl.get('common.cancel')}</Button>
        <Button type="primary" onClick={handleConfirm} loading={loading}>
          {intl.get('common.confirm')}
        </Button>
      </div>
    </>
  );
};

export default function ApplySpacePopover() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { sketchModel } = useStore();
  const handleOpen = () => {
    const isModified = sketchModel.checkModified();
    if (isModified) {
      setOpen(false);
      return message.warning(intl.get('sketch.saveTip'));
    }
    setOpen(!open);
  };
  const data = sketchModel.editor?.schema?.getData();

  return (
    <Popover
      overlayClassName="applyPopover"
      placement="bottom"
      content={<PopoverContent close={close} />}
      arrowPointAtCenter={true}
      trigger="click"
      open={open}
      destroyTooltipOnHide={true}
      onOpenChange={open => !open && setOpen(false)}
    >
      <Button type="primary" onClick={handleOpen} disabled={!data?.nodes.length && !data?.lines.length}>
        {intl.get('sketch.applyToSpace')}
      </Button>
    </Popover>
  );
}
