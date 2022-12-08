import React, { useMemo, useContext } from 'react';
import { Menu } from 'antd';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import { Link } from 'react-router-dom';
import Avatar from '@app/components/Avatar';
import { LanguageContext } from '@app/context';
import { INTL_LOCALE_SELECT } from '@app/config';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import styles from './index.module.less';

const HelpMenu = () => {
  const { toggleLanguage, currentLocale } = useContext(LanguageContext);
  const { global: { username, logout, version } } = useStore();
  const items = useMemo(() => [
    {
      key: 'star',
      label: <a
        className={styles.nebulaLink}
        href="https://github.com/vesoft-inc/nebula"
        target="_blank"
        data-track-category="navigation"
        data-track-action="star_nebula"
        data-track-label="from_navigation" rel="noreferrer">
        <Icon className={styles.navIcon} type="icon-studio-nav-github" />
      </a>
    },
    {
      key: 'language',
      label: <Icon className={styles.navIcon} type="icon-studio-nav-language" />,
      popupClassName: styles.langMenu,
      popupOffset: [-35, 20],
      children: Object.keys(INTL_LOCALE_SELECT).map(locale => ({
        key: `language-${locale}`,
        onClick: () => toggleLanguage(INTL_LOCALE_SELECT[locale].NAME),
        label: INTL_LOCALE_SELECT[locale].TEXT
      }))
    },
    {
      key: 'welcome',
      label: <Link className={styles.nebulaLink} to="/welcome">
        <Icon className={styles.navIcon} type="icon-studio-nav-help" />
      </Link>
    },
    {
      key: 'user',
      popupClassName: styles.accountMenu,
      popupOffset: [-35, 20],
      label: <div>
        <Avatar size="small" username={username}/>
      </div>,
      children: [
        {
          key: 'version-log',
          label: <a
            className={styles.nebulaLink}
            data-track-category="navigation"
            data-track-action="view_changelog"
            href={intl.get('link.versionLogHref')}
            target="_blank" rel="noreferrer"
          >
            <Icon className={styles.menuIcon} type="icon-studio-nav-version" />
            {intl.get('menu.release')}
          </a>  
        },
        {
          key: 'user-logout',
          label: <span className={styles.nebulaLink} onClick={logout}>
            <Icon className={styles.menuIcon} type="icon-studio-nav-clear" />
            {intl.get('configServer.clear')}
          </span>
        },
        {
          key: 'version',
          label: `v${version}`
        }
      ]
    }
  ], [currentLocale]);
  return <Menu
    className={styles.helpMenu}
    mode="horizontal"
    theme="dark"
    selectedKeys={[]}
    items={items}
  />;
};

export default observer(HelpMenu);
