import { FetchService } from '@vesoft-inc/utils';
import JSONBig from 'json-bigint';

const parser = JSONBig({ useNativeBigInt: true }).parse;

const fetcher = new FetchService({
  config: {
    baseURL: '/api-studio',
    transformResponse: [
      (data) => {
        try {
          return parser(data);
        } catch (e) {
          console.error('json-bigint parse error: ', e);
          return data;
        }
      },
    ],
  },
  interceptorsEjectors(ins) {
    ins.interceptors.response.use(
      (res) => {
        return res.data;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  },
});

export const execGql = (gql: string) => {
  return fetcher.post('/gql/exec', { gql });
};
