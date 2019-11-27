import { createModel } from '@rematch/core';

interface IState {
  currentStep: number;
}

export const importData = createModel({
  state: {
    currentStep: 0,
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: {},
});
