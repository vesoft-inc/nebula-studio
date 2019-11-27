import { createModel } from '@rematch/core';

export const importData = createModel({
  state: {
    progress: {
      currentStep: 'init',
    },
  },
  reducers: {},
  effects: {},
});
