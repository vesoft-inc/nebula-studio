import { computed, makeAutoObservable, observable } from 'mobx';
import { Base64 } from 'js-base64';
import i18n, { Language } from '@/utils/i18n';
import { connect, disconnect } from '@/services';
import { type RootStore } from '.';

export class CommonStore {
  dbName = 'NebulaGraph';
  prodName = 'Studio';

  rootStore?: RootStore;
  loading = false;
  language = i18n.language;

  username = '';
  /** `${string}:${number}` */
  host = '';

  i18n = i18n;

  constructor(rootStore?: RootStore) {
    makeAutoObservable(this, {
      // observables
      rootStore: observable.ref,

      // computed
      isEnLang: computed,

      // actions, beging with 'set', 'add', 'delete', etc.
      changeLanguage: false,
      login: false,
    });
    this.rootStore = rootStore;

    i18n.on('languageChanged', this.setLanguage);
  }

  get isEnLang() {
    return this.language === Language.EN_US;
  }

  setLoading = (loading: boolean) => {
    this.loading = loading;
  };

  setLanguage = (lng: string) => {
    this.language = lng;
  };

  changeLanguage = (lng: Language) => {
    i18n.changeLanguage(lng);
  };

  login = async (payload: { address: string; port: string; username: string; password: string }) => {
    const { port, username, password } = payload;
    const address = payload.address.trim().replace(/^https?:\/\//, '');
    const authorization = Base64.encode(JSON.stringify([username, password]));
    const { code } = await connect({ address, port: +port }, { headers: { Authorization: `Bearer ${authorization}` } });
    return code === 0;
  };

  logout = async () => {
    const res = await disconnect();
    if (res.code === 0) {
      this.username = '';
      this.host = '';
      this.rootStore?.routerStore?.push('/login');
    }
  };
}
