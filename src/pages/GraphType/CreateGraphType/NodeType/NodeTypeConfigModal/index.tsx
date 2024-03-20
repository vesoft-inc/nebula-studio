import { DialogContent } from '@mui/material';
import { ModalFooter } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form-mui';

import { useModal, useStore } from '@/stores';
import { INodeTypeItem } from '@/interfaces';
import NodeTypeConfigForm from '../NodeTypeConfigForm';

interface NodeTypeModalProps {
  nodeTypeItem?: INodeTypeItem;
}

function NodeTypeConfigModal(props: NodeTypeModalProps) {
  const { nodeTypeItem } = props;
  const { t } = useTranslation(['graphtype', 'common']);
  const modal = useModal();
  const { schemaStore } = useStore().graphtypeStore;

  const form = useForm<INodeTypeItem>({
    defaultValues: nodeTypeItem
      ? new INodeTypeItem(nodeTypeItem)
      : {
          properties: [],
        },
  });

  const onSubmit = (values: INodeTypeItem) => {
    if (nodeTypeItem) {
      schemaStore?.updateNodeType(nodeTypeItem.id, values);
    } else {
      schemaStore?.addNodeType(new INodeTypeItem(values));
    }
    modal.hide();
  };

  const handleCancel = () => {
    modal.hide();
  };

  return (
    <>
      <DialogContent dividers sx={{ width: 600 }}>
        <NodeTypeConfigForm form={form} />
      </DialogContent>
      <ModalFooter
        cancelText={t('cancel', { ns: 'common' })}
        okText={nodeTypeItem ? t('update', { ns: 'common' }) : t('create', { ns: 'common' })}
        onCancel={handleCancel}
        onOk={form.handleSubmit(onSubmit)}
      />
    </>
  );
}

export default NodeTypeConfigModal;
