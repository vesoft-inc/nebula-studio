import { _delete, get, post, put } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const connectDB = post('/api-nebula/db/connect');

const disconnectDB = post('/api-nebula/db/disconnect');

const importData = post('/api-nebula/task/import');

const handleImportAction = post('/api-nebula/task/import/action');

const getLog = get('/api/import/log');
const finishImport = post('/api/import/finish');

const getImportWokingDir = get('/api/import/working_dir');
const getUploadDir = get('/api/import/working_dir');
const getTaskDir = get('/api/import/task_dir');

const deteleFile = params => {
  const { filename } = params;
  return _delete(`/api/files/${filename}`)();
};
const getFiles = get('/api/files');
const getAppInfo = get('/api/app');
const uploadFiles = (params?, config?) =>
  put('/api/files')(params, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
export default {
  execNGQL,
  connectDB,
  disconnectDB,
  importData,
  finishImport,
  handleImportAction,
  getLog,
  getImportWokingDir,
  getUploadDir,
  getTaskDir,
  deteleFile,
  getFiles,
  getAppInfo,
  uploadFiles,
};
