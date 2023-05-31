import cls from 'classnames';

interface IProps extends React.HTMLProps<HTMLSpanElement> {
  type: string;
  className?: string;
}

const Icon = (props: IProps) => {
  const { type, className, ...otherProps } = props;
  return (
    <span role="img" className={cls('anticon', className)} {...otherProps}>
      <svg width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <use href={`#${type}`} />
      </svg>
    </span>
  );
};

export default Icon;
