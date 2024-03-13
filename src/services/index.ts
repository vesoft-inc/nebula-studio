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
          try {
            return JSON.parse(data);
          } catch (e) {
            console.error('JSON.parse error: ', e);
            throw e;
          }
        }
      },
    ],
  },
});

export const execGql = async <T = unknown>(gql: string): Promise<T> => {
  const res = await fetcher.post('/gql/exec', { gql });
  return res.data?.data;
};
