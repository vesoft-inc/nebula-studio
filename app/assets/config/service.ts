import { _delete, get, post } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const connectDB = post('/api-nebula/db/connect');

const importData = post('/api/import/import');

const getLog = get('/api/import/log');

const refresh = get('/api/import/refresh');

const deleteProcess = _delete('/api/import/process');

export default {
  execNGQL,
  connectDB,
  importData,
  getLog,
  refresh,
  deleteProcess,
};
