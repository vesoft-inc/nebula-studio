import { Modal } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form-mui';

import { useStore } from '@/stores';
import { INodeTypeItem } from '@/interfaces';
import NodeTypeConfigForm from './NodeTypeConfigForm';
import { useEffect } from 'react';

interface NodeTypeModalProps {
  open: boolean;
  onCancel: () => void;
  nodeTypeItem?: INodeTypeItem;
}

function NodeTypeConfigModal(props: NodeTypeModalProps) {
  const { nodeTypeItem, open, onCancel } = props;
  const { t } = useTranslation(['graphtype', 'common']);
  const { schemaStore } = useStore().graphtypeStore;

  const form = useForm<INodeTypeItem>({
    defaultValues: {
      properties: [],
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(new INodeTypeItem(nodeTypeItem));
    }
  }, [open]);

  const hanleOk = () => {
    form.handleSubmit(onSubmit)();
  };

  const onSubmit = (values: INodeTypeItem) => {
    if (nodeTypeItem) {
      schemaStore?.updateNodeType(nodeTypeItem.id, values);
    } else {
      schemaStore?.addNodeType(new INodeTypeItem(values));
    }
    onCancel();
  };

  return (
    <Modal
      title={nodeTypeItem ? t('editNodeType', { ns: 'graphtype' }) : t('createNodeType', { ns: 'graphtype' })}
      onCancel={onCancel}
      open={open}
      onOk={hanleOk}
      slotProps={{
        footer: {
          okText: nodeTypeItem ? t('update', { ns: 'common' }) : t('create', { ns: 'common' }),
        },
      }}
    >
      <NodeTypeConfigForm form={form} />
    </Modal>
  );
}

export default NodeTypeConfigModal;
