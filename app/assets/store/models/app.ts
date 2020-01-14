import { createModel } from '@rematch/core';

import service from '#assets/config/service';

interface IState {
  version: string;
}

export const app = createModel({
  state: {
    version: '',
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
    async asyncGetAppInfo() {
      const appInfo = await service.getAppInfo();

      this.update({
        ...appInfo,
      });
    },
  },
});
