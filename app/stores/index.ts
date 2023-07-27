import { createContext, useContext } from 'react';
import global from './global';
import files from './files';
import console from './console';
import dataImport from './import';
import schema from './schema';
import graphInstances from './graphInstances';
import sketchModel from './sketchModel';
import welcome from './welcome';
import datasource from './datasource';
import moduleConfiguration from './moduleConfiguration';

const rootStore = {
  global,
  files,
  console,
  dataImport,
  schema,
  graphInstances,
  sketchModel,
  welcome,
  datasource,
  moduleConfiguration,
};
const rootStoreRef = { current: rootStore };
// @ts-ignore
window.studioStore = rootStore;
export const getRootStore = () => rootStoreRef.current;
export const resetStore = () => {
  Object.keys(rootStore).forEach((key) => {
    const module = rootStore[key];
    module.resetModel && module.resetModel();
  });
};
export const storeContext = createContext(rootStore);
export const StoreProvider = storeContext.Provider;
export function useStore() {
  const store = useContext(storeContext);
  return store;
}

export default rootStore;
