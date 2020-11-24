import { _delete, get, post, put } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const connectDB = post('/api-nebula/db/connect');

const disconnectDB = post('/api-nebula/db/disconnect');

const importData = post('/api-import/submit');

const runImport = post('/api/import/import');

const stopImport = put('/api-import/stop');

const createConfigFile = post('/api/import/config');

const getLog = get('/api/import/log');

const deleteProcess = _delete('/api/import/process');

const getImportWokingDir = get('/api/import/working_dir');

const deteleFile = params => {
  const { filename } = params;
  return _delete(`/api/files/${filename}`)();
};
const getFiles = get('/api/files');
const getAppInfo = get('/api/app');

export default {
  execNGQL,
  connectDB,
  disconnectDB,
  importData,
  runImport,
  stopImport,
  createConfigFile,
  getLog,
  deleteProcess,
  getImportWokingDir,
  deteleFile,
  getFiles,
  getAppInfo,
};
