import { _delete, get, post, put } from '../utils/http';

let service = {
  execNGQL:  (params, config?) => {
    return post('/api-nebula/db/exec')(params, config)
  },
  batchExecNGQL: (params, config?) => {
    return post('/api-nebula/db/batchExec')(params, config)
  },
  connectDB: (params, config?) => {
    return post('/api-nebula/db/connect')(params, config)
  },
  disconnectDB: (params, config?) => {
    return post('/api-nebula/db/disconnect')(params, config)
  },
  importData: (params, config?) => {
    return post('/api/import-tasks/import')(params, config)
  },
  handleImportAction: (params, config?) => {
    return post('/api/import-tasks/action')(params, config)
  },
  getLog: (params, config?) => {
    return get('/api/import-tasks/logs')(params, config)
  },
  getErrLog: (params, config?) => {
    return get('/api/import-tasks/err-logs')(params, config)
  },
  finishImport: (params, config?) => {
    return post('/api/import/finish')(params, config)
  },
  getUploadDir: () => {
    return get('/api/import-tasks/working-dir')()
  },
  getTaskDir: () => {
    return get('/api/import-tasks/task-dir')()
  },
  deteleFile:params => {
    const { filename } = params;
    return _delete(`/api/files/${filename}`)();
  },
  getFiles: () => {
    return get('/api/files')()
  },
  uploadFiles: (params?, config?) => {
    put('/api/files')(params, { ...config, headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getTaskLogs: (params?, config?) => {
    const { id, ...others } = params;
    return get(`/api/import-tasks/${id}/task-log-names`)(others, config);
  },
  getTaskConfigUrl: (id: string | number) => `/api/import-tasks/config/${id}`,
  getTaskLogUrl: (id: string | number) => `/api/import-tasks/${id}/log`,
  getTaskErrLogUrl: (id: string | number) => `/api/import-tasks/${id}/err-logs`,
}

export const updateService = (partService: any) => {
  Object.assign(service, partService)
}

export default service;

