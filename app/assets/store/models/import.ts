import { createModel } from '@rematch/core';

interface IState {
  currentStep: number;
  activeStep: number;
  mountPath: string;
  files: object[];
}

export const importData = createModel({
  state: {
    activeStep: 0,
    currentStep: 5,
    mountPath: '',
    files: [] as any[],
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },
    nextStep: (state: IState, payload?: any) => {
      const { activeStep } = state;
      switch (activeStep) {
        case 0:
          const { mountPath } = payload;
          return {
            ...state,
            activeStep: 1,
            mountPath,
          };
        case 1:
          return {
            ...state,
            activeStep: 2,
          };
        default:
          return state;
      }
    },
  },
  effects: {},
});
