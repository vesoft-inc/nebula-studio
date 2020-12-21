import { message } from 'antd';
import axios from 'axios';
import JSONBigint from 'json-bigint';
import intl from 'react-intl-universal';

import { store } from '#assets/store';

const service = axios.create({
  transformResponse: [
    data => {
      try {
        // transform big int to string in js
        const _data = JSONBigint({ useNativeBigInt: true }).parse(data);
        return _data;
      } catch (err) {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
    },
  ],
});

service.interceptors.request.use(config => {
  config.headers['Content-Type'] = 'application/json';

  return config;
});

service.interceptors.response.use(
  (response: any) => {
    const { code, message: errMsg } = response.data;
    // if connection refused, login again
    if (
      code === -1 &&
      errMsg &&
      (errMsg.includes('connection refused') || errMsg.includes('broken pipe'))
    ) {
      message.warning(intl.get('warning.connectError'));
      store.dispatch({
        type: 'nebula/asyncClearConfigServer',
      });
    } else if (code === -1 && errMsg) {
      message.warning(errMsg);
    }
    return response.data;
  },
  (error: any) => {
    if (error.response && error.response.status) {
      message.error(
        `${intl.get('common.requestError')}: ${error.response.status} ${
          error.response.statusText
        }`,
      );
      return error.response;
    } else {
      message.error(`${intl.get('common.requestError')}: ${error}`);
      return error;
    }
  },
);

const get = (api: string) => (params?: object, config = {}) =>
  service.get(api, { params, ...config });

const post = (api: string) => (params?: object, config = {}) =>
  service.post(api, params, config);
const put = (api: string) => (params?: object, config = {}) =>
  service.put(api, params, config);

const _delete = (api: string) => (params?: object) =>
  service.delete(api, params);

export { get, post, put, _delete };
