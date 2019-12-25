import { _delete, get, post, put } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const connectDB = post('/api-nebula/db/connect');

const importData = post('/api-import/submit');

const runImport = post('/api/import/import');

const stopImport = put('/api-import/stop');

const testImport = post('/api/import/test');

const createConfigFile = post('/api/import/config');

const getLog = get('/api/import/log');

const checkImportFinish = get('/api/import/refresh');

const deleteProcess = _delete('/api/import/process');

export default {
  execNGQL,
  connectDB,
  importData,
  runImport,
  stopImport,
  testImport,
  createConfigFile,
  getLog,
  checkImportFinish,
  deleteProcess,
};
