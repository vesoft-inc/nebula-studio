import { createContext, useContext } from 'react';
import { RouterStore } from '@vesoft-inc/utils';
import { CommonStore } from './common';

export class RootStore {
  commonStore = new CommonStore(this);
  routerStore = new RouterStore();
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
