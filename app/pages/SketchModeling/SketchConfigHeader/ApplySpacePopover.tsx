import { Popover, Radio, Button, Form, Select, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useI18n } from '@vesoft-inc/i18n';
import CreateForm from '@app/pages/Schema/SpaceCreate/CreateForm';
import { useStore } from '@app/stores';
import { ExclamationCircleTwoTone } from '@ant-design/icons';
import { intersection } from 'lodash';
import { getSpaceCreateGQL, getTagOrEdgeCreateGQL } from '@app/utils/gql';
import { ISketchEdge, ISketchNode } from '@app/interfaces/sketch';
import { useHistory } from 'react-router-dom';
import { getVidType } from '@app/pages/Schema/SpaceCreate';
import { trackEvent } from '@app/utils/stat';
import { DEFAULT_PARTITION_NUM } from '@app/utils/constant';
import { handleKeyword } from '@app/utils/function';
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
  const tags = data.nodes.map((item) => ({
    name: item.name,
    comment: item.comment,
    properties: item.properties,
    type: item.type,
  }));
  const edges = data.lines.map((item) => ({
    name: item.name,
    comment: item.comment,
    properties: item.properties,
    type: item.type,
  }));
  return { tags, edges };
};

const getCreateGql = (data: ISketchNode | ISketchEdge) => {
  const { name, comment, properties, type } = data;
  return getTagOrEdgeCreateGQL({
    type,
    name,
    comment,
    properties,
  });
};

const PopoverContent = (props: IContentProps) => {
  const { close } = props;
  const { intl } = useI18n();
  const { schema, sketchModel, moduleConfiguration } = useStore();
  const { getMachineNumber, getSpaces, updateSpaceInfo } = schema;
  const { supportCreateSpace } = moduleConfiguration.schema;
  const [mode, setMode] = useState(supportCreateSpace ? 'create' : 'apply');
  const [spaces, setSpaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const history = useHistory();

  useEffect(() => {
    getMachineNumber();
    getSpaces();
  }, []);
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
    await schema.switchSpace(space);
    batchApplySchema(space, schemaInfo);
  }, []);

  const handleConfirm = useCallback(() => {
    form.validateFields().then(async (values) => {
      const data = sketchModel.editor?.schema?.getData();
      const schemaInfo = getSchemaInfo(data);
      if (mode === 'create') {
        setLoading(true);
        const { code, message: errMsg } = await handleCreateSpace(values);
        if (code !== 0) {
          if (errMsg && errMsg.toLowerCase().includes('existed')) {
            message.warning(intl.get('sketch.spaceExisted'));
          } else {
            message.warning(errMsg);
          }
          setLoading(false);
          return;
        }
        switchSpaceAndApply(values.name, schemaInfo);
        trackEvent('sketch', 'apply_sketch');
      } else {
        const { space } = values;
        await updateSpaceInfo(space);
        const hasIntersection = checkSchemaIntersection(schemaInfo);
        if (hasIntersection) {
          close();
          return;
        }
        setLoading(true);
        batchApplySchema(space, schemaInfo);
        trackEvent('sketch', 'batch_apply_sketch');
      }
    });
  }, [mode]);

  const checkSchemaIntersection = useCallback((schemaInfo) => {
    const { tags, edgeTypes } = schema;
    const { tags: newTags, edges: newEdges } = schemaInfo;
    const sameTags = intersection(
      newTags.map((item) => item.name),
      tags,
    );
    const sameEdges = intersection(
      newEdges.map((item) => item.name),
      edgeTypes,
    );
    if (!sameTags.length && !sameEdges.length) {
      return false;
    }
    const tagStr = sameTags.join('、');
    const edgeStr = sameEdges.join('、');
    let content = '';
    let hasType = '';
    if (tagStr) {
      content = intl.get('common.tag') + ` (${tagStr}) `;
      hasType = intl.get('common.tag');
    }
    if (edgeStr) {
      content += `${content ? ' / ' : ''}` + intl.get('common.edge') + ` (${edgeStr}) `;
      hasType += `${hasType ? ' / ' : ''}` + intl.get('common.edge');
    }
    message.warning(intl.get('sketch.sameSchemaWarning', { content, hasType }));
    return true;
  }, []);

  const handleCreateSpace = useCallback(async (data) => {
    const { name, partitionNum, replicaFactor, vidType, stringLength, comment } = data;
    const _vidType = getVidType(vidType, stringLength);
    const options = {
      partition_num: partitionNum || DEFAULT_PARTITION_NUM,
      replica_factor: replicaFactor,
      vid_type: _vidType,
    };
    const gql = getSpaceCreateGQL({
      name,
      options,
      comment,
    });
    const res = await schema.createSpace(gql);
    return res;
  }, []);

  const batchApplySchema = useCallback(async (space, schema) => {
    const { tags, edges } = schema;
    // hack If the space name is the same as the current space recorded on the golang server (refrence client.go) and the space has just been deleted, need to use it manually
    const gql =
      `use ${handleKeyword(space)};` +
      tags
        .map((tag) => getCreateGql(tag))
        .concat(edges.map((edge) => getCreateGql(edge)))
        .join(';');
    const { code, message: errMsg } = await sketchModel.batchApply(gql);
    if (code === 0) {
      setLoading(false);
      message.success(intl.get('schema.createSuccess'));
      setTimeout(() => {
        history.push('/schema/tag/list');
      }, 600);
      return;
    }
    if (errMsg && errMsg.toLowerCase().includes('spacenotfound')) {
      setTimeout(() => batchApplySchema(space, schema), 3000);
    } else {
      setLoading(false);
      message.warning(errMsg);
    }
  }, []);
  return (
    <>
      {supportCreateSpace && (
        <Radio.Group className={styles.radioTabs} onChange={handleChangeMode} value={mode} buttonStyle="solid">
          <Radio.Button value="create">{intl.get('sketch.createSpace')}</Radio.Button>
          <Radio.Button value="apply">{intl.get('sketch.selectSpace')}</Radio.Button>
        </Radio.Group>
      )}
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
        <Button disabled={loading} onClick={close}>
          {intl.get('common.cancel')}
        </Button>
        <Button type="primary" onClick={handleConfirm} loading={loading}>
          {intl.get('common.confirm')}
        </Button>
      </div>
    </>
  );
};

export default observer(function ApplySpacePopover() {
  const [open, setOpen] = useState(false);
  const [disabled, setDisable] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { sketchModel } = useStore();
  const { intl } = useI18n();
  const handleOpen = () => {
    const isModified = sketchModel.checkModified();
    if (isModified) {
      setOpen(false);
      return message.warning(intl.get('sketch.saveTip'));
    }
    setOpen(!open);
  };
  useEffect(() => {
    setTimeout(() => {
      const data = sketchModel.editor?.schema?.getData();
      setDisable(!data?.nodes.length && !data?.lines.length);
    }, 200);
  }, [sketchModel.active, sketchModel.editor, sketchModel.currentSketch]);
  return (
    <Popover
      overlayClassName={styles.applyPopover}
      placement="bottomRight"
      content={<PopoverContent close={close} />}
      arrow={true}
      trigger="click"
      open={open}
      onOpenChange={(open) => !open && setOpen(false)}
    >
      <Button type="primary" onClick={handleOpen} disabled={disabled}>
        {intl.get('sketch.applyToSpace')}
      </Button>
    </Popover>
  );
});
