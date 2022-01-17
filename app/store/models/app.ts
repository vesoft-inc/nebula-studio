import { createModel } from '@rematch/core';

import service from '#app/config/service';

interface IState {
  version: string;
}

export const app = createModel({
  state: {
    version: process.env.VERSION,
  },
  reducers: {
    update: (state: IState, payload: any) => {
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
    async asyncUploadFile(payload) {
      const { code, data } = (await service.uploadFiles(payload)) as any;
      return { code, data };
    },
  },
});
