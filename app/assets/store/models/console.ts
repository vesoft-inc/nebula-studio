import { createModel } from '@rematch/core';

import service from '#assets/config/service';

interface IState {
  version: string;
}

export const console = createModel({
  state: {
    currentGQL: 'SHOW SPACES;',
    result: {},
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
    async asyncRunGQL(gql) {
      const result = (await service.execNGQL(
        { gql },
        {
          trackEventConfig: {
            category: 'console',
            action: 'run_gql',
          },
        },
      )) as any;
      this.update({
        result,
        currentGQL: gql,
      });
    },
  },
});
