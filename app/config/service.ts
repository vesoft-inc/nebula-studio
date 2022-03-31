import { _delete, get, post, put } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const batchExecNGQL = post('/api-nebula/db/batchExec');

const connectDB = post('/api-nebula/db/connect');

const disconnectDB = post('/api-nebula/db/disconnect');

const importData = post('/api/import-tasks/import');

const handleImportAction = post('/api/import-tasks/action');

const getLog = get('/api/import-tasks/logs');
const getErrLog = get('/api/import-tasks/err-logs');
const finishImport = post('/api/import/finish');

const getUploadDir = get('/api/import-tasks/working-dir');
const getTaskDir = get('/api/import-tasks/task-dir');

const deteleFile = params => {
  const { filename } = params;
  return _delete(`/api/files/${filename}`)();
};
const getFiles = get('/api/files');
const uploadFiles = (params?, config?) =>
  put('/api/files')(params, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });


const getTaskLogs = (params?, config?) => {
  const { id, ...others } = params;
  return get(`/api/import-tasks/${id}/task-log-names`)(others, config);
};

const getTaskConfigUrl = (id: string | number) => `/api/import-tasks/config/${id}`;
const getTaskLogUrl = (id: string | number) => `/api/import-tasks/${id}/log`;
const getTaskErrLogUrl = (id: string | number) => `/api/import-tasks/${id}/err-logs`;
export default {
  execNGQL,
  batchExecNGQL,
  connectDB,
  disconnectDB,
  importData,
  finishImport,
  handleImportAction,
  getLog,
  getErrLog,
  getUploadDir,
  getTaskDir,
  deteleFile,
  getFiles,
  uploadFiles,
  getTaskConfigUrl,
  getTaskLogs,
  getTaskLogUrl,
  getTaskErrLogUrl
};
