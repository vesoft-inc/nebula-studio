import { _delete, get, post, put } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const batchExecNGQL = post('/api-nebula/db/batchExec');

const connectDB = post('/api-nebula/db/connect');

const disconnectDB = post('/api-nebula/db/disconnect');

const importData = post('/api-nebula/task/import');

const handleImportAction = post('/api-nebula/task/import/action');

const getLog = get('/api/import/log');
const getErrLog = get('/api/import/err_log');
const finishImport = post('/api/import/finish');

const getImportWokingDir = get('/api/import/working_dir');
const getUploadDir = get('/api/import/working_dir');
const getTaskDir = get('/api/import/task_dir');

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
  return get(`/api/import/task_log_paths/${id}`)(others, config);
};

const getTaskConfigUrl = (id: number) => `/api-nebula/task/import/config/${id}`;
const getTaskLogUrl = (path: string) => `/api-nebula/task/import/log?pathName=${encodeURI(path)}`;
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
  getImportWokingDir,
  getUploadDir,
  getTaskDir,
  deteleFile,
  getFiles,
  uploadFiles,
  getTaskConfigUrl,
  getTaskLogs,
  getTaskLogUrl
};
