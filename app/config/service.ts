import { _delete, get, post, put } from '../utils/http';

const service = {
  execNGQL: (params, config?) => {
    return post('/api-nebula/db/exec')(params, config);
  },
  batchExecNGQL: (params, config?) => {
    return post('/api-nebula/db/batchExec')(params, config);
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
    const { filename } = params;
    return _delete(`/api/files/${filename}`)();
  },
  getFiles: () => {
    return get('/api/files')();
  },
  uploadFiles: (params?, config?) => {
    put('/api/files')(params, { ...config, headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const updateService = (partService: any) => {
  Object.assign(service, partService);
};

export default service;

