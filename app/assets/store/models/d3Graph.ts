import { createModel } from '@rematch/core';

interface IState {
  canvasOffsetX: number;
  canvasOffsetY: number;
  canvasScale: number;
  showSider: boolean;
  showDisplayPanel: boolean;
  isZoom: boolean;
}

export const d3Graph = createModel({
  state: {
    canvasOffsetX: 0,
    canvasOffsetY: 0,
    canvasScale: 1,
    showSider: true,
    showDisplayPanel: true,
    isZoom: false,
  },
  reducers: {
    update: (state: IState, payload: any): IState => {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: () => ({}),
});
