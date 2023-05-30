import { SVGProps } from 'react';

import './index.less';

interface IProps extends SVGProps<any> {
  type: string;
  className?: string;
}

const Icon = (props: IProps) => {
  const { type, className, ...others } = props;
  return (
    <svg className={`icon ${className ? className : ''}`} aria-hidden="true" {...others}>
      <use href={`#${type}`} />
    </svg>
  );
};

export default Icon;
