import { Button, Input, Modal, Select, message } from 'antd';
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { IField } from '@app/interfaces/schema';
import { POSITIVE_INTEGER_REGEX } from '@app/utils/constant';
import Instruction from '@app/components/Instruction';
const Option = Select.Option;

import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';

interface IProps {
  visible: boolean;
  source: IField[];
  onClose: () => void;
  onAddField: (params: {
    field: string,
    strLength: string
  }) => void;
}

const FieldSelectModal = (props: IProps) => {
  const { source, onAddField, onClose, visible } = props;
  const [selectedField, setSelectedField] = useState<IField | null>(null);
  const [indexLength, setIndexLength] = useState('');
  const { intl } = useI18n();
  const handleFieldAdd = () => {
    if (
      selectedField?.Type === 'string' &&
      !indexLength.match(POSITIVE_INTEGER_REGEX)
    ) {
      return message.warning(intl.get('schema.indexedLengthRequired'));
    }
    onAddField({
      field: selectedField.Field,
      strLength: selectedField?.Type === 'string' ? indexLength : undefined,
    });
    handleClose();
  };

  const handleClose = () => {
    setSelectedField(null);
    setIndexLength('');
    onClose();
  };

  const handleFieldSelect = (value: string) => {
    const selectedData = source.filter(
      field => field.Field === value,
    )[0];
    setSelectedField(selectedData);
    if(selectedData.Type.startsWith('fixed_string')) {
      setIndexLength(selectedData.Type.replace(/[fixed_string(|)]/g, ''));
    }
  };
  return (
    <Modal
      className={styles.modalFieldAdd}
      maskClosable={false}
      destroyOnClose={true}
      open={visible}
      width="640px"
      onCancel={handleClose}
      title={intl.get('common.addProperty')}
      footer={
        <>
          <Button onClick={handleClose}>
            {intl.get('common.cancel')}
          </Button>
          <Button
            key="confirm"
            type="primary"
            disabled={selectedField === null}
            onClick={handleFieldAdd}
          >
            {intl.get('common.confirm')}
          </Button>
        </>
      }
    >
      <div className={styles.modalItem}>
        <Select
          placeholder={intl.get('schema.selectFields')}
          onChange={handleFieldSelect}
          className={styles.selectField}
        >
          {source.map(item => (
            <Option value={item.Field} key={item.Field}>
              {item.Field}
            </Option>
          ))}
        </Select>
      </div>
      {/* string & fixed string should supply length parameter */}
      {selectedField?.Type.includes('string') && (
        <div className={styles.modalItem}>
          <Input
            disabled={selectedField?.Type.startsWith('fixed_string')}
            placeholder={indexLength || intl.get('schema.indexedLength')}
            className={styles.inputIndexLength}
            onChange={e => setIndexLength(e.target.value)}
          />
          <Instruction
            description={intl.get('schema.indexedLengthDescription')}
          />
        </div>
      )}
    </Modal>
  );
};

export default observer(FieldSelectModal);
