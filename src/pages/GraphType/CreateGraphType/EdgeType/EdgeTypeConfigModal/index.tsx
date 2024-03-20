import { DialogContent } from '@mui/material';
import { ModalFooter } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';
import EdgeTypeConfigForm from '../EdgeTypeConfigForm';
import { useModal, useStore } from '@/stores';
import { useForm } from 'react-hook-form-mui';
import { IEdgeTypeItem } from '@/interfaces';
// import { PropertyDataType } from '@/utils/constant';

interface EdgeTypeModalProps {
  edgeTypeItem?: IEdgeTypeItem;
}

function EdgeTypeConfigModal(props: EdgeTypeModalProps) {
  const { edgeTypeItem } = props;
  const { t } = useTranslation(['graphtype', 'common']);
  const modal = useModal();
  const { schemaStore } = useStore().graphtypeStore;

  const form = useForm<IEdgeTypeItem>({
    values: edgeTypeItem,
    defaultValues: {
      properties: [],
    },
  });

  const onSubmit = (values: IEdgeTypeItem) => {
    if (edgeTypeItem) {
      schemaStore?.updateEdgeType(edgeTypeItem.id, values);
    }
    modal.hide();
  };

  return (
    <>
      <DialogContent dividers sx={{ width: 600 }}>
        <EdgeTypeConfigForm form={form} />
      </DialogContent>
      <ModalFooter
        cancelText={t('cancel', { ns: 'common' })}
        okText={edgeTypeItem ? t('update', { ns: 'common' }) : t('create', { ns: 'common' })}
        onCancel={() => {
          modal.hide();
        }}
        onOk={form.handleSubmit(onSubmit)}
      />
    </>
  );
}

export default EdgeTypeConfigModal;
