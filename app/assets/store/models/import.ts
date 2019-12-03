import { createModel } from '@rematch/core';

interface IState {
  currentStep: number;
  activeStep: number;
  mountPath: string;
  files: object[];
  vertexesConfig: object[];
  activeVertex: string;
  vertexAddCount: number;
}

export const importData = createModel({
  state: {
    activeStep: 0,
    currentStep: 5,
    mountPath: '',
    files: [] as any[],
    vertexesConfig: [] as any[],
    activeVertex: '',
    vertexAddCount: 0,
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },
    newVertexConfig: (state: IState, payload: any) => {
      const { file } = payload;
      const { vertexesConfig, vertexAddCount } = state;
      const vertexName = `Vertex ${vertexAddCount}`;
      return {
        ...state,
        vertexesConfig: [
          ...vertexesConfig,
          {
            name: vertexName,
            file,
          },
        ],
        activeVertex: vertexName,
        vertexAddCount: vertexAddCount + 1,
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
