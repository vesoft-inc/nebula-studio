import { createModel } from '@rematch/core';

import service from '#app/config/service';

interface IState {
  currentGQL: string;
  result: any;
  paramsMap: any;
}

// split from semicolon out of quotation marks
const SEMICOLON_REG = /((?:[^;'"]*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')[^;'"]*)+)|;/;
const splitQuery = (query: string) => {
  const queryList = query.split(SEMICOLON_REG).filter(Boolean);
  const paramList: string[] = [];
  const gqlList: string[] = [];
  queryList.forEach(query => {
    const _query = query.trim();
    if (_query.startsWith(':')) {
      paramList.push(_query);
    } else {
      gqlList.push(_query);
    }
  });
  return {
    paramList,
    gqlList,
  };
};

export const _console = createModel({
  state: {
    currentGQL: 'SHOW SPACES;',
    result: {},
    paramsMap: null,
  } as IState,
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
      const { gqlList, paramList } = splitQuery(gql);
      const result = (await service.execNGQL(
        {
          gql: gqlList.join(';'),
          paramList,
        },
        {
          trackEventConfig: {
            category: 'console',
            action: 'run_gql',
          },
        },
      )) as any;
      const updateQuerys = paramList.filter(item => {
        const reg = /^\s*:params/gim;
        return !reg.test(item);
      });
      if (updateQuerys.length > 0) {
        await this.asyncGetParams();
      }
      this.update({
        result,
        currentGQL: gql,
      });
    },
    async asyncGetParams() {
      const result = (await service.execNGQL(
        {
          gql: '',
          paramList: [':params'],
        },
        {
          trackEventConfig: {
            category: 'console',
            action: 'run_gql',
          },
        },
      )) as any;
      this.update({
        paramsMap: result.data?.localParams || {},
      });
    },
  },
});
