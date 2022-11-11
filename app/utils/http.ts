import { message } from 'antd';
import axios from 'axios';
import JSONBigint from 'json-bigint';
import { getI18n } from '@vesoft-inc/i18n';

import { getRootStore } from '@app/stores';
import { trackEvent } from './stat';

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

const { intl } = getI18n();

const service = axios.create({
  transformResponse: [
    data => {
      try {
        const _data = JSONBigint.parse(data);
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
    return response.data;
  },
  (error: any) => {
    if (error.response?.status) {
      const res = error.response.data || {};
      if(res.code !== 0 && res.message) {
        const { hideErrMsg } = error.response.config;
        !hideErrMsg && message.error(res.message);
      } else {
        message.error(
          `${intl.get('common.requestError')}: ${error.response.status} ${
            error.response.statusText
          }`,
        );
      }
      // relogin
      if (res.code === HttpResCode.ErrSession) {
        getRootStore().global.logout();
      }
      return res;
    } else {
      message.error(`${intl.get('common.requestError')}: ${error}`);
      return error;
    }
  },
);

const sendRequest = async (type: string, api: string, params?, config?) => {
  const { trackEventConfig, ...otherConfig } = config;
  let res;
  switch (type) {
    case 'get':
      res = (await service.get(api, { params, ...otherConfig })) as any;
      break;
    case 'post':
      res = (await service.post(api, params, otherConfig)) as any;
      break;
    case 'put':
      res = (await service.put(api, params, otherConfig)) as any;
      break;
    case 'delete':
      res = (await service.delete(api, params)) as any;
      break;
    default:
      break;
  }

  if (res && trackEventConfig) {
    trackService(res, trackEventConfig);
  }
  return res;
};

const trackService = (res, config) => {
  const { category, action } = config;
  trackEvent(category, action, res.code === 0 ? 'ajax_success' : 'ajax_failed');
};

const get = (api: string) => (params?: object, config = {}) =>
  sendRequest('get', api, params, config);

const post = (api: string) => (params?: object, config = {} as any) =>
  sendRequest('post', api, params, config);

const put = (api: string) => (params?: object, config = {}) =>
  sendRequest('put', api, params, config);

const _delete = (api: string) => (params?: object, config = {}) =>
  sendRequest('delete', api, params, config);

export { get, post, put, _delete };
