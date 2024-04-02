import { Modal } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';

interface EdgeTypeModalProps {
  label?: string;
  open: boolean;
  onCancel: () => void;
}

function LabelModal(props: EdgeTypeModalProps) {
  const { label, open, onCancel } = props;
  const { t } = useTranslation(['graphtype', 'common']);

  return (
    <Modal
      title={label ? t('editEdgeType', { ns: 'graphtype' }) : t('createEdgeType', { ns: 'graphtype' })}
      open={open}
      // onOk={form.handleSubmit(onSubmit)}
      onCancel={onCancel}
    ></Modal>
  );
}

export default LabelModal;
