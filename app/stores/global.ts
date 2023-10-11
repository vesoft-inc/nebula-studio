import { action, makeObservable, observable } from 'mobx';
import cookies from 'js-cookie';
import { message } from 'antd';
import { Base64 } from 'js-base64';
import { getI18n } from '@vesoft-inc/i18n';
import { BrowserHistory } from 'history';
import service from '@app/config/service';
import ngqlRunner from '@app/utils/websocket';
import { isValidIP } from '@app/utils/function';
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
    this.ngqlRunner.logoutFun = this.logout;
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
    // clear storage before reset store, some store data is related to storage
    this.clearStorage();
    this.clearCookies();
    resetStore();
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
    Object.keys(payload).forEach(
      (key) => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]),
    );
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
      cookies.set('nh', _host);
      cookies.set('nu', username);
      const socketConncted = await this.ngqlRunner.connect({
        config: {
          url: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/nebula_ws`,
        },
        logoutFun: this.logout,
      });
      this.update({ _host, _username: username });
      return socketConncted;
      // return true;
    }

    this.update({ _host: '', _username: '' });
    cookies.remove('nh');
    cookies.remove('nu');
    return false;
  };

  getGraphAddress = async () => {
    const { code, data } = await service.execNGQL({ gql: 'show hosts graph;' });
    const list =
      code !== 0
        ? []
        : data.tables.reduce((acc, cur) => {
            if (isValidIP(cur.Host) && cur.Status === 'ONLINE') {
              acc.push(`${cur.Host}:${cur.Port}`);
            }
            return acc;
          }, []);
    return list.length ? list : [this.host];
  };
}

const globalStore = new GlobalStore();

export default globalStore;
