import { action, makeObservable, observable } from 'mobx';
import cookies from 'js-cookie';
import { message } from 'antd';
import { Base64 } from 'js-base64';
import { getI18n } from '@vesoft-inc/i18n';
import { BrowserHistory } from 'history';
import service from '@app/config/service';
import ngqlRunner from '@app/utils/websocket';
import { getRootStore, resetStore } from '.';

const { intl } = getI18n();
export class GlobalStore {
  gConfig = window.gConfig;
  appSetting = {
    beta: {
      functions: {
        viewSchema: { open: true },
      },
    },
  };
  history: BrowserHistory;
  _username = cookies.get('nu');
  _host = cookies.get('nh');
  version = process.env.VERSION;

  ngqlRunner = ngqlRunner;

  constructor() {
    makeObservable(this, {
      _username: observable,
      _host: observable,
      ngqlRunner: observable.ref,
      update: action,
    });
  }

  get rootStore() {
    return getRootStore();
  }

  get username() {
    return this._username || cookies.get('nu');
  }
  get host() {
    return this._host || cookies.get('nh');
  }

  resetModel = () => {
    this.update({
      _username: '',
      _host: '',
    });
  };

  logout = async () => {
    await service.disconnectDB(
      {},
      {
        trackEventConfig: {
          category: 'user',
          action: 'sign_out',
        },
      },
    );
    resetStore();
    this.clearStorage();
    this.clearCookies();
    this.ngqlRunner?.desctory();
    this.history.push(`/login${location.search}`);
  };

  clearCookies = () => {
    cookies.remove('nh');
    cookies.remove('nu');
  };
  clearStorage = () => {
    sessionStorage.clear();
    localStorage.removeItem('currentSpace');
  };
  update = (payload: Record<string, any>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  login = async (payload: { address: string; port: string; username: string; password: string }) => {
    const { address, port, username, password } = payload;
    const _address = address.trim().replace(/^https?:\/\//, '');
    const _host = `${_address}:${port}`;
    const authorization = Base64.encode(JSON.stringify([username, password]));
    const { code } = (await service.connectDB(
      {
        address: _address,
        port: +port,
      },
      {
        trackEventConfig: {
          category: 'user',
          action: 'sign_in',
        },
        headers: {
          Authorization: `Bearer ${authorization}`,
        },
      },
    )) as any;
    if (code === 0) {
      message.success(intl.get('configServer.success'));
      cookies.set('nh', _host);
      cookies.set('nu', username);
      const socketConncted = await this.ngqlRunner.connect(`ws://${location.host}/nebula_ws`);
      this.update({ _host, _username: username });
      return socketConncted;
      // return true;
    }

    this.update({ _host: '', _username: '' });
    cookies.remove('nh');
    cookies.remove('nu');
    return false;
  };
}

const globalStore = new GlobalStore();

export default globalStore;
