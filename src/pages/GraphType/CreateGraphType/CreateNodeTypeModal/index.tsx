import { DialogContent } from '@mui/material';
import { ModalFooter } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';
import NodeTypeConfigForm from '../NodeTypeConfigForm';
import { useModal } from '@/stores';
import { useForm } from 'react-hook-form-mui';

function CreateNodeTypeModal() {
  const { t } = useTranslation(['graphtype', 'common']);
  const modal = useModal();
  const form = useForm();

  const onSubmit = (values: unknown) => {
    console.log('values', values);
  };

  return (
    <>
      <DialogContent dividers sx={{ width: 600 }}>
        <NodeTypeConfigForm form={form} />
      </DialogContent>
      <ModalFooter
        cancelText={t('cancel', { ns: 'common' })}
        okText={t('create', { ns: 'common' })}
        onCancel={() => {
          modal.hide();
        }}
        onOk={form.handleSubmit(onSubmit)}
      />
    </>
  );
}

export default CreateNodeTypeModal;
