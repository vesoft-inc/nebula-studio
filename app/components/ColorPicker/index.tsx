import React from 'react';
import { TwitterPicker } from 'react-color';

import { COLOR_PICK_LIST } from '@app/config/explore';

import './index.less';

interface IProps {
  onChangeComplete?: (color: string) => void;
  onChange?: (color: string) => void;
}

const ColorPicker: React.FC<IProps> = (props: IProps) => {
  const { onChange, onChangeComplete } = props;
  const handleChange = color => {
    if (onChange) {
      onChange(color);
    }
  };

  const handleChangeComplete = (color, _event) => {
    if (onChangeComplete) {
      onChangeComplete(color);
    }
  };

  return (
    <TwitterPicker
      width="240px"
      className="custom-picker"
      onChange={handleChange}
      onChangeComplete={handleChangeComplete}
      colors={COLOR_PICK_LIST}
      triangle="hide"
    />
  );
};

export default ColorPicker;
