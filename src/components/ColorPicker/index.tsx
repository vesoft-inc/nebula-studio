import { useCallback, useState } from 'react';
import { SketchPicker } from 'react-color';
import debounce from 'lodash.debounce';

import { COLOR_PICK_LIST } from './colors';

interface ColorPickerProps {
  color?: string;
  onChangeComplete?: (color: string) => void;
}

function ColorPicker(props: ColorPickerProps) {
  const { color, onChangeComplete } = props;
  const [curColor, setCurColor] = useState<string | undefined>(color);

  const onColorChange = useCallback(
    debounce((color: string) => onChangeComplete?.(color), 100),
    []
  );

  return (
    <SketchPicker
      disableAlpha
      color={curColor}
      width="300px"
      onChange={(color) => {
        setCurColor(color.hex);
        onColorChange(color.hex);
      }}
      presetColors={COLOR_PICK_LIST}
    />
  );
}

export default ColorPicker;
