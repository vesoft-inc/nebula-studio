import { action, makeObservable, observable } from 'mobx';
import cookies from 'js-cookie';
import { message } from 'antd';
import { Base64 } from 'js-base64';
import intl from 'react-intl-universal';
import service from '@app/config/service';
import { BrowserHistory } from 'history';
import { NebulaVersion } from './types';
import { getRootStore, resetStore } from '.';

export class GlobalStore {
  history: BrowserHistory;
  username = cookies.get('nu');
  host = cookies.get('nh');
  version = process.env.VERSION;
  nebulaVersion?: NebulaVersion = cookies.get('NebulaVersion');
  constructor() {
    makeObservable(this, {
      username: observable,
      host: observable,
      update: action,
    });
  }

  get rootStore() {
    return getRootStore();
  }

  resetModel = () => {
    this.update({
      username: '',
      host: '',
      paramsMap: null
    });
  }

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
  };

  update = (payload: Record<string, any>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  login = async (payload: { host: string; username: string; password: string }) => {
    const { host, username, password } = payload;
    const [address, port] = host.replace(/^https?:\/\//, '').split(':');
    const { code, data } = (await service.connectDB(
      {
        address,
        port: +port,
      },
      {
        trackEventConfig: {
          category: 'user',
          action: 'sign_in',
        },
        headers: {
          Authorization: `Bearer ${Base64.encode(`${username}:${password}`)}`,
        },
      },
    )) as any;
    if (code === 0) {
      message.success(intl.get('configServer.success'));
      cookies.set('nh', host);
      cookies.set('nu', username);
      this.update({ host, username, nebulaVersion: data.version });
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
