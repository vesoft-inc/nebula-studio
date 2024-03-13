import { action, makeObservable, observable } from 'mobx';
import i18n, { Language } from '@/utils/i18n';
import { type RootStore } from '.';

export class CommonStore {
  rootStore?: RootStore;
  loading = false;
  language = i18n.language;

  i18n = i18n;

  constructor(rootStore?: RootStore) {
    makeObservable(this, {
      language: observable,
      rootStore: observable.ref,
      setLoading: action,
      updateLanguage: action,
    });
    this.rootStore = rootStore;

    i18n.on('languageChanged', this.updateLanguage);
  }

  setLoading = (loading: boolean) => {
    this.loading = loading;
  };

  updateLanguage = (lng: string) => {
    this.language = lng;
  };

  setLanguage = (lng: Language) => {
    i18n.changeLanguage(lng);
  };
}
