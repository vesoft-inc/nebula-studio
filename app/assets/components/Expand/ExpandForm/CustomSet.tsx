import React from 'react';
import intl from 'react-intl-universal';
import MenuButton from '#assets/components/Button';
import VertexDisplay from '#assets/components/VertexDisplay';

interface IProps {
    showTitle?: boolean;
    showIcon?: boolean;
    customColor?: string;
    customIcon?: string;
    onColorChange?: (color: string) => void;
    onIconChange?: (icon: string) => void;
}

class CustomSet extends React.PureComponent<IProps> {
    handleChangeColorComplete = color => {
        const { hex: _color } = color;
        this.props.onColorChange?.(_color);
    };

    handleChangeIconComplete = icon => {
        this.props.onIconChange?.(icon);
    };

    render() {
        const {
            showTitle,
            showIcon,
            customIcon,
            customColor,
        } = this.props;
        return (
            <>
        <MenuButton
            tips={!showTitle ? intl.get('common.color') : undefined}
          component={
            <VertexDisplay
              showIcon={showIcon}
              handleChangeColorComplete={this.handleChangeColorComplete}
              handleChangeIconComplete={this.handleChangeIconComplete}
              customIcon={customIcon}
              customColor={customColor}
              editing={true}
            />
          }
          trackCategory="explore"
          trackAction="color_picker"
          trackLabel="from_panel"
        />
      </>
        )
    }
}

export default CustomSet;