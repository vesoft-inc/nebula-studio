import React from 'react';
import { TwitterPicker } from 'react-color';

import { COLOR_PICK_LIST } from '#app/config/explore';

import './index.less';

interface IProps {
  children?: any;
  handleChangeColorComplete?: (color: string) => void;
  handleChange?: (color: string) => void;
}

interface IState {
  visible: boolean;
}

class ColorPicker extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  handleChange = color => {
    if (this.props.handleChange) {
      const { hex: _color } = color;
      this.props.handleChange(_color);
    }
  };

  handleChangeComplete = (color, _event) => {
    if (this.props.handleChangeColorComplete) {
      const { hex: _color } = color;
      this.props.handleChangeColorComplete(_color);
    }
  };

  render() {
    return (
      <div className="popover-color">
        <TwitterPicker
          width="240px"
          className="custom-picker"
          onChange={this.handleChange}
          onChangeComplete={this.handleChangeComplete}
          colors={COLOR_PICK_LIST}
          triangle="hide"
        />
        {this.props.children}
      </div>
    );
  }
}

export default ColorPicker;
