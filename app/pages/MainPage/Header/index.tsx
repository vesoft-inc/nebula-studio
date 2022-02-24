import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import intl from 'react-intl-universal';
import HelpMenu from './HelpMenu';
import Icon from '@app/components/Icon';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import './index.less';
const { Header } = Layout;

interface IMenuItem {
  key: string;
  path: string;
  track: {
    category: string;
    action: string;
    label: string;
  },
  icon: string,
  intlKey: string
}

interface IProps {
  menus: IMenuItem[]
}

const PageHeader = (props: IProps) => {
  const { menus } = props;
  const [activeKey, setActiveKey] = useState<string>('');
  const { global: { username, host } } = useStore();
  const location = useLocation();
  const handleMenuClick = async({ key }) => {
    setActiveKey(key);
  };


  useEffect(() => {
    const { pathname } = location;
    const activeKey = pathname.split('/')[1];
    setActiveKey(activeKey);
  }, []);

  return <Header className="studio-header">
    <div className="nebula-logo">
      Nebula Studio
    </div>
    {host && username ? <>
      <Menu
        className="main-menu"
        mode="horizontal"
        theme="dark"
        selectedKeys={[activeKey]}
        onClick={handleMenuClick}
      >
        {menus.map(item => <Menu.Item key={item.key}>
          <Link
            className="nav-link"
            to={item.path}
            data-track-category={item.track.category}
            data-track-action={item.track.action}
            data-track-label={item.track.label}
          >
            <Icon className="nav-icon" type={item.icon} />
            {intl.get(item.intlKey)}
          </Link>
        </Menu.Item>)}
      </Menu>
      <HelpMenu />
    </>
      : <HelpMenu />}
  </Header>;
};

export default observer(PageHeader);
