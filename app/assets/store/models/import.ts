import { createModel } from '@rematch/core';

interface IState {
  currentStep: number;
  activeStep: number;
  mountPath: string;
  files: object[];
  vertexesConfig: object[];
}

export const importData = createModel({
  state: {
    activeStep: 0,
    currentStep: 5,
    mountPath: '',
    files: [] as any[],
    vertexesConfig: [] as any[],
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },
    newVertexConfig: (state: IState, payload?: any) => {
      const { file } = payload;
      const { vertexesConfig } = state;
      return {
        ...state,
        vertexesConfig: [
          ...vertexesConfig,
          {
            name: `Vertex ${vertexesConfig.length}`,
            file,
          },
        ],
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
