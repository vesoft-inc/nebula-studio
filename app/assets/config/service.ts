import { _delete, get, post, put } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const connectDB = post('/api-nebula/db/connect');

const importData = post('/api-import/submit');

const runImport = post('/api/import/import');

const stopImport = put('/api-import/stop');

const createConfigFile = post('/api/import/config');

const getLog = get('/api/import/log');

const deleteProcess = _delete('/api/import/process');

const getImportWokingDir = get('/api/import/working_dir');

export default {
  execNGQL,
  connectDB,
  importData,
  runImport,
  stopImport,
  createConfigFile,
  getLog,
  deleteProcess,
  getImportWokingDir,
};
