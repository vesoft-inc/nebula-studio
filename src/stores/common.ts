import { type RootStore } from '@src/stores';
import { action, makeObservable, observable } from 'mobx';

export class CommonStore {
  rootStore: RootStore;
  loading = false;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      rootStore: observable.ref,
      setLoading: action,
    });
    this.rootStore = rootStore;
  }

  setLoading = (loading: boolean) => {
    this.loading = loading;
  };
}
