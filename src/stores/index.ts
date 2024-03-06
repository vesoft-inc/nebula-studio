import { createContext, useContext } from 'react';
import { RouterStore, themeStore } from '@vesoft-inc/utils';
import { ModalStore } from '@vesoft-inc/ui-components';
import { CommonStore } from './common';

// themeStore.updateThemeOptions({
//   components: {
//     MuiButton: {
//       variants: [
//         {
//           props: { variant: 'outlined' },
//           style: {
//             borderColor: themeStore.palette.vesoft.textColor5,
//             color: themeStore.palette.vesoft.themeColor1,
//           },
//         },
//         {
//           props: { variant: 'contained' },
//           style: {
//             backgroundColor: themeStore.palette.vesoft.themeColor1,
//           },
//         },
//       ]
//     }
//   }
// })

export class RootStore {
  commonStore = new CommonStore(this);
  routerStore = new RouterStore();
  themeStore = themeStore;
  modalStore = new ModalStore();
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
export function useModal() {
  const store = useStore();
  return store.modalStore;
}
