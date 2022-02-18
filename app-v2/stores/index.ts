import { createContext, useContext } from 'react';
import global from './global';
import files from './files';
import console from './console';
import dataImport from './import';
import schema from './schema';

const rootStore = { global, files, console, dataImport, schema };
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

export default rootStore;
