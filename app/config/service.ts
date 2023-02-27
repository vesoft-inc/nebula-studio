import ngqlRunner from '@app/utils/websocket';
import { _delete, get, post, put } from '../utils/http';

const service = {
  // execNGQL: (params, config?) => {
  //   return post('/api-nebula/db/exec')(params, config);
  // },
  execNGQL: (...args: Parameters<typeof ngqlRunner.runNgql>) => {
    const [params, config] = args;
    return ngqlRunner.runNgql(params, config);
  },
  // batchExecNGQL: (params, config?) => {
  //   return post('/api-nebula/db/batchExec')(params, config);
  // },
  batchExecNGQL: (...args: Parameters<typeof ngqlRunner.runBatchNgql>) => {
    const [params, config] = args;
    return ngqlRunner.runBatchNgql(params, config);
  },
  connectDB: (params, config?) => {
    return post('/api-nebula/db/connect')(params, config);
  },
  disconnectDB: (params, config?) => {
    return post('/api-nebula/db/disconnect')(params, config);
  },
  // import
  importData: (params, config?) => {
    return post('/api/import-tasks')(params, config);
  },
  stopImportTask: (id: number) => {
    return get(`/api/import-tasks/${id}/stop`)();
  },
  deleteImportTask: (id: number) => {
    return _delete(`/api/import-tasks/${id}`)();
  },
  getTaskList: (params?, config?) => {
    return get('/api/import-tasks')(params, config);
  },
  getTaskLogs: (params?, config?) => {
    const { id, ...others } = params;
    return get(`/api/import-tasks/${id}/task-log-names`)(others, config);
  },
  getLogDetail: (params, config?) => {
    const { id, ...others } = params;
    return get(`/api/import-tasks/${id}/logs`)(others, config);
  },
  getTaskConfig: (id: string | number) => `/api/import-tasks/${id}/download-config`,
  getTaskLog: (id: string | number) => `/api/import-tasks/${id}/download-logs`,
  // files
  deteleFile: params => {
    return _delete(`/api/files`)(undefined, { data: params });
  },
  getFiles: () => {
    return get('/api/files')();
  },
  updateFileConfig: (params?, config?) => {
    return post('/api/files/update')(params, config);
  },
  uploadFiles: (params?, config?) => {
    return put('/api/files')(params, { ...config, headers: { 'Content-Type': 'multipart/form-data' } });
  },
  initSketch: (params, config?) => {
    return post(`/api/sketches/sketch`)(params, config);
  },
  getSketchList: (params, config?) => {
    return get(`/api/sketches/list`)(params, config);
  },
  updateSketch: (params, config?) => {
    const { id, ...restParams } = params;
    return put(`/api/sketches/${id}`)(restParams, config);
  },
  deleteSketch: (id: string, config?) => {
    return _delete(`/api/sketches/${id}`)(undefined, config);
  },
  getSchemaSnapshot: (params, config?) => {
    return get(`/api/schema/snapshot`)(params, config);
  },
  updateSchemaSnapshot: (params, config?) => {
    const { ...restParams } = params;
    return put(`/api/schema/snapshot`)(restParams, config);
  },
  deleteFavorite: (id, config?) => {
    return _delete(`/api/favorites/${id}`)(undefined, config);
  },
  deleteAllFavorites: () => {
    return _delete(`/api/favorites`)();
  },
  getFavoriteList: () => {
    return get(`/api/favorites/list`)();
  },
  saveFavorite: (params, config?) => {
    return post(`/api/favorites`)(params, config);
  },
};

export const updateService = (partService: any) => {
  Object.assign(service, partService);
};

export default service;

