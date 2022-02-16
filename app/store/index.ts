import { RematchDispatch, RematchRootState, init } from '@rematch/core';
import loading, { ExtraModelsFromLoading } from '@rematch/loading';
import immerPlugin from '@rematch/immer';

import { IRootModel, models } from './models';


type FullModel = ExtraModelsFromLoading<IRootModel>
  
export const store = init<IRootModel, FullModel>({
  models,
  plugins: [
    loading(),
    immerPlugin()
  ],
  redux: {
    devtoolOptions: {},
    rootReducers: { RESET_APP: () => undefined },
  },
});

export type IStore = typeof store;
export type IDispatch = RematchDispatch<IRootModel>;
export type IRootState = RematchRootState<IRootModel, FullModel>
