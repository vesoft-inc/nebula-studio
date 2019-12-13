import { _delete, get, post } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const connectDB = post('/api-nebula/db/connect');

const importData = post('/api/import/import');

const testImport = post('/api/import/test');

const createConfigFile = post('/api/import/config');

const getLog = get('/api/import/log');

const checkImportFinish = get('/api/import/refresh');

const deleteProcess = _delete('/api/import/process');

export default {
  execNGQL,
  connectDB,
  importData,
  testImport,
  createConfigFile,
  getLog,
  checkImportFinish,
  deleteProcess,
};
