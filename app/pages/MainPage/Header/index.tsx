import { useMemo, useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@app/components/Icon';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import logo from '@app/static/images/studio_logo.png';
import { useI18n } from '@vesoft-inc/i18n';
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
  };
  icon: string;
  intlKey: string;
}

interface IProps {
  menus: IMenuItem[];
}

const PageHeader = (props: IProps) => {
  const { menus } = props;
  const { intl, currentLocale } = useI18n();
  const [activeKey, setActiveKey] = useState<string>('');
  const {
    global: { username, host },
  } = useStore();
  const { pathname } = useLocation();
  const handleMenuClick = async ({ key }) => {
    setActiveKey(key);
  };

  const MenuItems = useMemo(
    () =>
      menus.map((item) => ({
        key: item.key,
        label: (
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
        ),
      })),
    [currentLocale],
  );
  useEffect(() => {
    const activeKey = pathname.split('/')[1];
    setActiveKey(activeKey);
  }, [pathname]);

  return (
    <Header className={styles.studioHeader}>
      <Link to="/welcome" className={styles.nebulaLogo}>
        <img src={logo} alt="logo" height={40} />
      </Link>
      {host && username ? (
        <>
          <Menu
            className={styles.mainMenu}
            mode="horizontal"
            theme="dark"
            selectedKeys={[activeKey]}
            onClick={handleMenuClick}
            items={MenuItems}
          />
          <HelpMenu />
        </>
      ) : (
        <HelpMenu />
      )}
    </Header>
  );
};

export default observer(PageHeader);
