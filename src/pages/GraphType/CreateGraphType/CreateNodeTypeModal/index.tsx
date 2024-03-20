import { DialogContent } from '@mui/material';
import { ModalFooter } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';
import NodeTypeConfigForm from '../NodeTypeConfigForm';
import { useModal, useStore } from '@/stores';
import { useForm } from 'react-hook-form-mui';
import { INodeTypeItem, IProperty } from '@/interfaces';
import { PropertyDataType } from '@/utils/constant';

function CreateNodeTypeModal() {
  const { t } = useTranslation(['graphtype', 'common']);
  const modal = useModal();
  const { schemaStore } = useStore().graphtypeStore;
  const form = useForm<INodeTypeItem>({
    defaultValues: {
      properties: [
        new IProperty({
          name: '',
          type: PropertyDataType.STRING,
        }),
      ],
    },
  });

  const onSubmit = (values: INodeTypeItem) => {
    schemaStore?.addNodeType(values);
    modal.hide();
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
