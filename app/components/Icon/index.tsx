import React, { HTMLProps } from 'react';

interface IIconFontProps extends HTMLProps<HTMLElement> {
  type: string;
}

const IconFont = (props: IIconFontProps) => {
  const { type, className, ...others } = props;
  return (
    <span className={`nebula-studio-icon ${type} ${className}`} {...others} />
  );
};

export default IconFont;
