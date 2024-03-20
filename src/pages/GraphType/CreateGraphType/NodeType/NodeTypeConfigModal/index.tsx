import { DialogContent } from '@mui/material';
import { ModalFooter } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';
import NodeTypeConfigForm from '../NodeTypeConfigForm';
import { useModal, useStore } from '@/stores';
import { useForm } from 'react-hook-form-mui';
import { INodeTypeItem } from '@/interfaces';
// import { PropertyDataType } from '@/utils/constant';

interface NodeTypeModalProps {
  nodeTypeItem?: INodeTypeItem;
}

function NodeTypeConfigModal(props: NodeTypeModalProps) {
  const { nodeTypeItem } = props;
  const { t } = useTranslation(['graphtype', 'common']);
  const modal = useModal();
  const { schemaStore } = useStore().graphtypeStore;

  const form = useForm<INodeTypeItem>({
    values: nodeTypeItem,
    defaultValues: {
      properties: [],
    },
  });

  const onSubmit = (values: INodeTypeItem) => {
    if (nodeTypeItem) {
      schemaStore?.updateNodeType(nodeTypeItem.id, values);
    }
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
        onCancel={() => {
          modal.hide();
        }}
        onOk={form.handleSubmit(onSubmit)}
      />
    </>
  );
}

export default NodeTypeConfigModal;
