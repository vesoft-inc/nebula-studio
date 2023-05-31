import cls from 'classnames';

interface IProps {
  type: string;
  className?: string;
  onClick?: () => void;
}

const Icon = (props: IProps) => {
  const { type, className, onClick } = props;
  return (
    <span role="img" className={cls('anticon', className)} onClick={onClick}>
      <svg width="1em" height="1em" fill="currentColor" aria-hidden="true">
        <use href={`#${type}`} />
      </svg>
    </span>
  );
};

export default Icon;
