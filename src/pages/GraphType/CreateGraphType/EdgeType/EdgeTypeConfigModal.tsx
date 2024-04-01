import { Modal } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';
import EdgeTypeConfigForm from './EdgeTypeConfigForm';
import { useStore } from '@/stores';
import { useForm } from 'react-hook-form-mui';
import { IEdgeTypeItem } from '@/interfaces';
import { useEffect } from 'react';

interface EdgeTypeModalProps {
  edgeTypeItem?: IEdgeTypeItem;
  open: boolean;
  onCancel: () => void;
}

function EdgeTypeConfigModal(props: EdgeTypeModalProps) {
  const { edgeTypeItem, open, onCancel } = props;
  const { t } = useTranslation(['graphtype', 'common']);
  const { schemaStore } = useStore().graphtypeStore;

  const form = useForm<IEdgeTypeItem>({
    defaultValues: {
      properties: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (edgeTypeItem) {
        form.reset(new IEdgeTypeItem(edgeTypeItem));
      } else {
        form.reset();
      }
    }
  }, [open]);

  const onSubmit = (values: IEdgeTypeItem) => {
    if (edgeTypeItem) {
      schemaStore?.updateEdgeType(edgeTypeItem.id, values);
    } else {
      schemaStore?.addEdgeType(new IEdgeTypeItem(values));
    }
    onCancel();
  };

  return (
    <Modal
      title={edgeTypeItem ? t('editEdgeType', { ns: 'graphtype' }) : t('createEdgeType', { ns: 'graphtype' })}
      open={open}
      onOk={form.handleSubmit(onSubmit)}
      onCancel={onCancel}
      slotProps={{
        footer: {
          okText: edgeTypeItem ? t('update', { ns: 'common' }) : t('create', { ns: 'common' }),
        },
      }}
    >
      <EdgeTypeConfigForm form={form} />
    </Modal>
  );
}

export default EdgeTypeConfigModal;
