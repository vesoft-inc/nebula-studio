import React, { useContext } from 'react';
import { Menu } from 'antd';
import intl from 'react-intl-universal';
import Icon from '@appv2/components/Icon';
import Avatar from '@appv2/components/Avatar';
import { LanguageContext } from '@appv2/context';
import { INTL_LOCALE_SELECT } from '@appv2/config';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import './index.less';
import { trackPageView } from '@appv2/utils/stat';

const HelpMenu = () => {
  const { toggleLanguage } = useContext(LanguageContext);
  const { global: { username, logout, version } } = useStore();
  const DOC_LIST = [
    {
      link: 'link.mannualHref',
      icon: 'iconimage-icon12',
      title: 'menu.use',
      track: '/user-mannual'
    },
    {
      link: 'link.nGQLHref',
      icon: 'iconimage-icon12',
      title: 'menu.nGql',
      track: '/nebula-doc'
    },
    {
      link: 'link.forumLink',
      icon: 'iconimage-icon12',
      title: 'menu.forum',
      track: '/form'
    },
  ];
  return <Menu
    className="help-menu"
    mode="horizontal"
    theme="dark"
  >
    <Menu.SubMenu 
      key="language"
      popupClassName="lang-menu"
      popupOffset={[-35, 0]} 
      title={<Icon type="iconimage-icon27" />}> 
      {Object.keys(INTL_LOCALE_SELECT).map(locale => {
        return (
          <Menu.Item key={`language-${locale}`} onClick={() => toggleLanguage(INTL_LOCALE_SELECT[locale].NAME)}>
            {INTL_LOCALE_SELECT[locale].TEXT}
          </Menu.Item>
        );
      })}
    </Menu.SubMenu>
    <Menu.SubMenu 
      key="doc"
      popupClassName="doc-menu"
      popupOffset={[-35, 0]} 
      title={<Icon type="iconimage-icon12" />}> 
      {DOC_LIST.map(item => <Menu.Item key={item.title} onClick={() => trackPageView(item.track)}>
        <a href={intl.get(item.link)} target="_blank" rel="noreferrer">
          <Icon type={item.icon} />
          {intl.get(item.title)}
        </a>
      </Menu.Item>)}
    </Menu.SubMenu>
    <Menu.SubMenu 
      key="user"
      popupClassName="account-menu" 
      popupOffset={[-35, 0]}
      title={<div>
        <Avatar size="small" username={username}/>
      </div>}>
      <Menu.Item key="version-log">
        <a
          data-track-category="navigation"
          data-track-action="view_changelog"
          href={intl.get('link.versionLogHref')}
          target="_blank" rel="noreferrer"
        >
          <Icon className="menu-icon" type="iconlogout" />
          {intl.get('menu.release')}
        </a>
      </Menu.Item>
      <Menu.Item key="user-logout">
        <span className="btn-logout" onClick={logout}>
          <Icon className="menu-icon" type="iconlogout" />
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
