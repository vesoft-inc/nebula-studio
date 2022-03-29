import { Breadcrumb, PageHeader } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@app/components/Icon';

import './index.less';

interface IProps {
  routes: {
    path: string;
    breadcrumbName: string;
  }[];
  extraNode?: JSX.Element;
}

const itemRender = (route, _params, routes, _paths) => {
  const final = routes.indexOf(route) === routes.length - 1;
  const first = routes.indexOf(route) === 0;
  return final ? (
    <span>{route.breadcrumbName}</span>
  ) : first ? <> 
    <Link to={routes[routes.length - 2].path}><Icon className="arrow-icon" type="icon-studio-btn-return" /></Link>
    <Link to={route.path}>{route.breadcrumbName}</Link>
  </> : (
    <Link to={route.path}>
      {route.breadcrumbName}
    </Link>
  );
};

const NebulaBreadcrumb: React.FC<IProps> = (props: IProps) => {
  const { routes, extraNode } = props;
  return (
    <PageHeader
      title={null}
      className="nebula-breadcrumb"
      breadcrumbRender={() => {
        return <div className="breadcrumb-container center-layout">
          <Breadcrumb 
            routes={routes} 
            itemRender={itemRender} 
          />
          {extraNode}
        </div>;
      }}
    />
  );
};

export default NebulaBreadcrumb;
