import { Button, Input, Modal, Select, message } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { IField } from '@app/interfaces/schema';
import { POSITIVE_INTEGER_REGEX } from '@app/utils/constant';
import { handleKeyword } from '@app/utils/function';
import Instruction from '@app/components/Instruction';
const Option = Select.Option;

import './index.less';

interface IProps {
  visible: boolean;
  source: IField[];
  onClose: () => void;
  onAddField: (field: string) => void;
}

const FieldSelectModal = (props: IProps) => {
  const { source, onAddField, onClose, visible } = props;
  const [selectedField, setSelectedField] = useState<IField | null>(null);
  const [indexLength, setIndexLength] = useState('');
  const handleFieldAdd = () => {
    if (
      selectedField?.Type === 'string' &&
      !indexLength.match(POSITIVE_INTEGER_REGEX)
    ) {
      return message.warning(intl.get('schema.indexedLengthRequired'));
    }
    const newField =
      selectedField?.Type === 'string'
        ? handleKeyword(selectedField.Field) + `(${indexLength})`
        : handleKeyword(selectedField!.Field);
    onAddField(newField);
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
      className="modal-field-add"
      maskClosable={false}
      closable={false}
      destroyOnClose={true}
      visible={visible}
      footer={
        <>
          <Button
            key="confirm"
            type="primary"
            disabled={selectedField === null}
            onClick={handleFieldAdd}
          >
            {intl.get('explore.confirm')}
          </Button>
          <Button onClick={handleClose}>
            {intl.get('common.cancel')}
          </Button>
        </>
      }
    >
      <div className="modal-item">
        <span>{intl.get('schema.selectFields')}:</span>
        <Select
          onChange={handleFieldSelect}
          className="select-field"
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
        <div className="modal-item">
          <span>{intl.get('schema.indexedLength')}:</span>
          <Input
            disabled={selectedField?.Type.startsWith('fixed_string')}
            placeholder={indexLength}
            className="input-index-length"
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
