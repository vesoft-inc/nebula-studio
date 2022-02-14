import { makeObservable, action, observable } from 'mobx';
import cookies from 'js-cookie';
import { message } from 'antd';
import intl from 'react-intl-universal';
import service from '@appv2/config/service';
import { BrowserHistory } from 'history';
import { INTL_LOCALES, INTL_LOCALE_SELECT } from '@appv2/config/constants';
import { trackEvent } from '@appv2/utils/stat';
import { NebulaVersion } from './types';
import { getRootStore } from '.';

export class GlobalStore {
  history: BrowserHistory;
  username = cookies.get('nu');
  host = cookies.get('nh');
  /** global language */
  currentLocale = localStorage.getItem('locale') || INTL_LOCALE_SELECT.EN_US.NAME;
  version = process.env.VERSION;
  nebulaVersion?: NebulaVersion = cookies.get('NebulaVersion');
  constructor() {
    makeObservable(this, {
      username: observable,
      host: observable,
      currentLocale: observable,
      update: action,
    });
    intl.init({ currentLocale: this.currentLocale, locales: INTL_LOCALES });
  }


  get rootStore() {
    return getRootStore();
  }


  

  clearConfigServer = async () => {
    await service.disconnectDB(
      {},
      {
        trackEventConfig: {
          category: 'user',
          action: 'sign_out',
        },
      },
    );
    this.update({
      host: '',
      username: '',
      currentSpace: '',
    });
    cookies.remove('nh');
    cookies.remove('nu');
  };

  update = (payload: Record<string, any>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  asyncChangeLocale = async (locale: string) => {
    this.update({ currentLocale: locale });
    localStorage.setItem('locale', locale);
    trackEvent('navigation', 'change_language', locale);
    await intl.init({ currentLocale: locale, locales: INTL_LOCALES });
    // history.push(`${location.pathname}`, {
    //   lang: locale
    // });
  };

  asyncLogin = async (payload: { host: string; username: string; password: string }) => {
    const { host, username, password } = payload;
    const [address, port] = host.replace(/^https?:\/\//, '').split(':');
    const { code } = (await service.connectDB(
      {
        address,
        port: +port,
        username,
        password,
      },
      {
        trackEventConfig: {
          category: 'user',
          action: 'sign_in',
        },
      },
    )) as any;
    if (code === 0) {
      message.success(intl.get('configServer.success'));
      cookies.set('nh', host);
      cookies.set('nu', username);
      this.update({ host, username, nebulaVersion: cookies.get('NebulaVersion') });
      return true;
    }

    this.update({ host: '', username: '' });
    cookies.remove('nh');
    cookies.remove('nu');
    return false;
  };
}

const globalStore = new GlobalStore();

export default globalStore;
