import type { RootStore } from '@/stores';

const rootStoreRef = { current: undefined as unknown as RootStore };

export const getRootStore = () => rootStoreRef.current;

export const setRootStore = (store: RootStore) => {
  if (rootStoreRef.current) {
    throw new Error('`rootStore` has been set already');
  }
  rootStoreRef.current = store;
};
