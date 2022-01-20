/**
 * inspired by rematch: https://github.com/rematch/rematch
 */
import { RematchDispatch, RematchRootState, init } from '@rematch/core';
import createLoadingPlugin from '@rematch/loading';

import * as models from './models';

const loading = createLoadingPlugin({});

export const store = init({
  models,
  plugins: [loading],
  redux: {
    devtoolOptions: {},
    rootReducers: { RESET_APP: () => undefined },
  },
});

export type IStore = typeof store;
export type IDispatch = RematchDispatch<typeof models>;
interface ILoadingPlugin {
  loading: {
    models: RematchRootState<typeof models>;
    // you can use effects here for getting async effect loading state
    effects: IDispatch;
  };
}
export type IRootState = RematchRootState<typeof models> & ILoadingPlugin;
