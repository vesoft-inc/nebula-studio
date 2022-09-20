import Icon from '@app/components/Icon';
import { Input, InputRef } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.module.less';

export default function SketchTitleInput(props: { value?: string; onChange?: (value: string) => void }) {
  const [mode, setMode] = useState('view' as 'view' | 'edit');
  const [value, setValue] = useState(props.value || '');
  const inputRef = useRef<InputRef>();

  useEffect(() => {
    if (mode === 'edit') {
      setValue(props.value || '');
      inputRef.current.focus();
    }
  }, [mode]);
  const handleUpdate = useCallback(() => {
    const val = value.trim();
    val && props.onChange?.(val);
    setMode('view');
  }, [value]);
  return (
    <div className={styles.sketchTitle}>
      {mode !== 'edit' ? (
        <span>{props.value}</span>
      ) : (
        <Input
          size="small"
          ref={inputRef}
          onBlur={handleUpdate}
          onPressEnter={handleUpdate}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
      {mode !== 'edit' && value !== '' && (
        <Icon
          className={styles.editIcon}
          type="icon-workflow-edit"
          onClick={() => {
            setMode('edit');
          }}
        />
      )}
    </div>
  );
}
