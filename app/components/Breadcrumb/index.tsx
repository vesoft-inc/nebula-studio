import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
// eslint-disable-next-line no-duplicate-imports
import type { BreadcrumbProps } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import cls from 'classnames';
import Icon from '@app/components/Icon';
import styles from './index.module.less';

interface IProps {
  routes: {
    path: string;
    breadcrumbName: string;
  }[];
  extraNode?: JSX.Element;
}

const NebulaBreadcrumb: React.FC<IProps> = (props: IProps) => {
  const { routes, extraNode } = props;

  const itemRender: BreadcrumbProps['itemRender'] = useCallback((route, _params, routes, _paths) => {
    const final = route === routes.at(-1);
    const first = route === routes.at(0);
    return final ? (
      <span>{route.breadcrumbName}</span>
    ) : first ? (
      <>
        <Link to={routes[routes.length - 2].path}>
          <Icon className={styles.arrowIcon} type="icon-studio-btn-return" />
        </Link>
        <Link to={route.path}>{route.breadcrumbName}</Link>
      </>
    ) : (
      <Link to={route.path}>{route.breadcrumbName}</Link>
    );
  }, []);

  return (
    <PageHeader
      className={styles.studioBreadcrumb}
      breadcrumbRender={() => (
        <div className={cls(styles.breadcrumbContainer, 'studioCenterLayout')}>
          <Breadcrumb className={styles.breadcrumb} items={routes} itemRender={itemRender} />
          {extraNode}
        </div>
      )}
    />
  );
};

export default NebulaBreadcrumb;
