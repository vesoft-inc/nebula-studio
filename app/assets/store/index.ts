/**
 * inspired by rematch: https://github.com/rematch/rematch
 */
import { init, RematchDispatch, RematchRootState } from '@rematch/core';
import createLoadingPlugin from '@rematch/loading';

import * as models from './models';

const loading = createLoadingPlugin({});

export const store = init({
  models,
  plugins: [loading],
});

export type IStore = typeof store;
export type IDispatch = RematchDispatch<typeof models>;
export type IRootState = RematchRootState<typeof models>;
