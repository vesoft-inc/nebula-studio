import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import logo from '@app/static/images/logo_studio.svg';
import HelpMenu from './HelpMenu';
import styles from './index.module.less';
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
  const { pathname } = useLocation();
  const handleMenuClick = async ({ key }) => {
    setActiveKey(key);
  };


  useEffect(() => {
    const activeKey = pathname.split('/')[1];
    setActiveKey(activeKey);
  }, [pathname]);

  return <Header className={styles.studioHeader}>
    <div className={styles.nebulaLogo}>
      <img src={logo} alt="logo" />
    </div>
    {host && username ? <>
      <Menu
        className={styles.mainMenu}
        mode="horizontal"
        theme="dark"
        selectedKeys={[activeKey]}
        onClick={handleMenuClick}
      >
        {menus.map(item => <Menu.Item key={item.key}>
          <Link
            className={styles.navLink}
            to={item.path}
            data-track-category={item.track.category}
            data-track-action={item.track.action}
            data-track-label={item.track.label}
          >
            <Icon className={styles.navIcon} type={item.icon} />
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
