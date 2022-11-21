import { action, makeObservable, observable } from 'mobx';
import cookies from 'js-cookie';
import { message } from 'antd';
import { Base64 } from 'js-base64';
import { getI18n } from '@vesoft-inc/i18n';
import service from '@app/config/service';
import { BrowserHistory } from 'history';
import { getRootStore, resetStore } from '.';

const { intl } = getI18n();
export class GlobalStore {
  history: BrowserHistory;
  _username = cookies.get('nu');
  _host = cookies.get('nh');
  version = process.env.VERSION;
  constructor() {
    makeObservable(this, {
      _username: observable,
      _host: observable,
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
    cookies.remove('nh');
    cookies.remove('nu');
    this.history.push(`/login${location.search}`);
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
      this.update({ _host, _username: username });
      return true;
    }

    this.update({ _host: '', _username: '' });
    cookies.remove('nh');
    cookies.remove('nu');
    return false;
  };
}

const globalStore = new GlobalStore();

export default globalStore;
