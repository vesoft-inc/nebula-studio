import { observable, action, makeObservable } from 'mobx';
import { type BrowserHistory, type Location } from '@remix-run/router';
import type { RootStore } from '.';

export class RouterStore {
  rootStore?: RootStore;
  location: Location;
  history: BrowserHistory;

  constructor(rootStore?: RootStore) {
    makeObservable(this, {
      location: observable.ref,
      history: observable.ref,
      rootStore: observable.ref,
      updateLocation: action,
    });
    this.rootStore = rootStore;
  }

  updateHistory = (history: BrowserHistory) => (this.history = history);
  updateLocation = (location: Location) => (this.location = location);

  push = (...args: Parameters<BrowserHistory['push']>) => this.history.push(...args);
  go = (...args: Parameters<BrowserHistory['go']>) => this.history.go(...args);
  replace = (...args: Parameters<BrowserHistory['replace']>) => this.history.replace(...args);
  back = () => this.history.go(-1);
  forward = () => this.history.go(1);
}
