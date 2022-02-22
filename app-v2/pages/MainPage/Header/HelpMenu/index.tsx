import React, { useContext } from 'react';
import { Menu } from 'antd';
import intl from 'react-intl-universal';
import Icon from '@appv2/components/Icon';
import { Link } from 'react-router-dom';
import Avatar from '@appv2/components/Avatar';
import { LanguageContext } from '@appv2/context';
import { INTL_LOCALE_SELECT } from '@appv2/config';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import './index.less';

const HelpMenu = () => {
  const { toggleLanguage } = useContext(LanguageContext);
  const { global: { username, logout, version } } = useStore();
  return <Menu
    className="help-menu"
    mode="horizontal"
    theme="dark"
  >
    <Menu.Item key="star">
      <a
        className="nebula-link"
        href="https://github.com/vesoft-inc/nebula"
        target="_blank"
        data-track-category="navigation"
        data-track-action="star_nebula"
        data-track-label="from_navigation" rel="noreferrer">
        <Icon className="nav-icon" type="icon-nav-github" />
      </a>
    </Menu.Item>
    <Menu.SubMenu 
      key="language"
      popupClassName="lang-menu"
      popupOffset={[-35, 20]} 
      title={<Icon className="nav-icon" type="icon-nav-language" />}> 
      {Object.keys(INTL_LOCALE_SELECT).map(locale => {
        return (
          <Menu.Item key={`language-${locale}`} onClick={() => toggleLanguage(INTL_LOCALE_SELECT[locale].NAME)}>
            {INTL_LOCALE_SELECT[locale].TEXT}
          </Menu.Item>
        );
      })}
    </Menu.SubMenu>
    <Menu.Item key="doc">
      <Link className="nebula-link" to="/doc">
        <Icon className="nav-icon" type="icon-nav-help" />
      </Link>
    </Menu.Item>
    <Menu.SubMenu 
      key="user"
      popupClassName="account-menu" 
      popupOffset={[-35, 20]}
      title={<div>
        <Avatar size="small" username={username}/>
      </div>}>
      <Menu.Item key="version-log">
        <a
          className="nebula-link"
          data-track-category="navigation"
          data-track-action="view_changelog"
          href={intl.get('link.versionLogHref')}
          target="_blank" rel="noreferrer"
        >
          <Icon className="menu-icon" type="icon-btn-save" />
          {intl.get('menu.release')}
        </a>
      </Menu.Item>
      <Menu.Item key="user-logout">
        <span className="nebula-link" onClick={logout}>
          <Icon className="menu-icon" type="icon-btn-save" />
          {intl.get('configServer.clear')}
        </span>
      </Menu.Item>
      <Menu.Item key="version">
        v{version}
      </Menu.Item>
    </Menu.SubMenu>
  </Menu>;
};

export default observer(HelpMenu);
