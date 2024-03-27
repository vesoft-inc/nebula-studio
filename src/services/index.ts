import { FetchService } from '@vesoft-inc/utils';
import JSONBig from 'json-bigint';

let controller = new AbortController();
const parser = JSONBig({ useNativeBigInt: true }).parse;

export enum HttpResCode {
  ErrBadRequest = 40004000,
  ErrParam = 40004001,
  ErrUnauthorized = 40104000,
  ErrSession = 40104001,
  ErrForbidden = 40304000,
  ErrNotFound = 40404000,
  ErrInternalServer = 50004000,
  ErrNotImplemented = 50104000,
  ErrUnknown = 90004000,
}

const fetcher = new FetchService({
  config: {
    baseURL: '/api-studio',
    transformResponse: [
      (data, header, code) => {
        if (header.get('content-type') !== 'application/json') {
          if (code! >= 200 && code! < 300) {
            return { code: 0, data };
          }

          // other http error status
          // code === 503 && data === 'Request Timeout'
          // return { code: 503, message: 'Request Timeout' }
          return { code, message: data };
        }
        try {
          return parser(data);
        } catch (e) {
          return { code: HttpResCode.ErrUnknown, message: `${e}`, data };
        }
      },
    ],
  },
  interceptorsEjectors(ins) {
    ins.interceptors.request.use((config) => {
      config.headers['Content-Type'] = 'application/json';
      config.signal = controller.signal;
      return config;
    });
    ins.interceptors.response.use(
      (response) => response,
      (error) => {
        const response = error?.response || {};
        if (response.data?.code === HttpResCode.ErrSession) {
          controller.abort();
          controller = new AbortController();
          const redirect = `${location.pathname}${location.search}`;
          window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        }
        return response;
      }
    );
  },
});

export const connect = async (
  payload: { address: string; port: number },
  config: { headers: { Authorization: string } }
) => {
  const res = await fetcher.post('/db/connect', payload, config);
  return res.data;
};

export const disconnect = async () => {
  const res = await fetcher.post('/db/disconnect');
  return res.data;
};

export const execGql = async <T = unknown>(gql: string) => {
  const res = await fetcher.post<T>('/gql/exec', { gql });
  return res.data;
};
