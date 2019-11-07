/**
 * inspired by rematch: https://github.com/rematch/rematch
 */
import { init, RematchDispatch, RematchRootState } from '@rematch/core';

import * as models from './models';

export const store = init({
  models,
});

export type IStore = typeof store;
export type IDispatch = RematchDispatch<typeof models>;
export type IRootState = RematchRootState<typeof models>;
