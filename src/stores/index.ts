import { createContext, useContext } from 'react';
import { CommonStore } from './common';

export class RootStore {
  commonStore = new CommonStore(this);
}

const rootStore = new RootStore();

const rootStoreRef = { current: rootStore };

// @ts-ignore
window.rootStore = rootStore;

export const getRootStore = () => rootStoreRef.current;
export const storeContext = createContext(rootStore);
export const StoreProvider = storeContext.Provider;
export function useStore() {
  const store = useContext(storeContext);
  return store;
}
