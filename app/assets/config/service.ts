import { post } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const connectDB = post('/api-nebula/db/connect');

const importData = post('/import');

const readLog = post('/log');

const reFinish = post('/refinish');

const processKill = post('/process_kill');

export default {
  execNGQL,
  connectDB,
  importData,
  readLog,
  reFinish,
  processKill,
};
