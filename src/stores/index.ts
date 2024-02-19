import { createContext, useContext } from 'react';
import { CommonStore } from './common';
import { RouterStore } from './router';

export class RootStore {
  commonStore = new CommonStore(this);
  routerStore = new RouterStore(this);
}

const rootStore = new RootStore();

const rootStoreRef = { current: rootStore };

// @ts-ignore
window.studioStore = rootStore;

export const getRootStore = () => rootStoreRef.current;
export const storeContext = createContext(rootStore);
export const StoreProvider = storeContext.Provider;
export function useStore() {
  const store = useContext(storeContext);
  return store;
}
