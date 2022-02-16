import { createModel } from '@rematch/core';
import type { IRootModel } from '.';

import service from '#app/config/service';

interface IState {
  version: string;
}

export const app = createModel<IRootModel>()({
  state: {
    version: process.env.VERSION,
  } as IState,
  reducers: {
    update: (state: IState, payload: object): IState => {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: {
    async asyncGetImportFiles() {
      const { code, data } = (await service.getFiles()) as any;
      return { code, data };
    },
    async asyncUploadFile(payload: Record<string, unknown>) {
      const { data, config } = payload;
      const res = (await service.uploadFiles(data, config)) as any;
      return res;
    },
  },
});
