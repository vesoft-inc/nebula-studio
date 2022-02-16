import { createModel } from '@rematch/core';
import type { IRootModel } from '.';

interface IState {
  canvasOffsetX: number;
  canvasOffsetY: number;
  canvasScale: number;
  showSider: boolean;
  showDisplayPanel: boolean;
  isZoom: boolean;
}

export const d3Graph = createModel<IRootModel>()({
  state: {
    canvasOffsetX: 0,
    canvasOffsetY: 0,
    canvasScale: 1,
    showSider: true,
    showDisplayPanel: true,
    isZoom: false,
  } as IState,
  reducers: {
    update: (state: IState, payload: object): IState => {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: () => ({}),
});
