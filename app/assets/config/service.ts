import { post } from '../utils/http';

const execNGQL = post('/api-nebula/db/exec');

const connectDB = post('/api-nebula/db/connect');

export default {
  execNGQL,
  connectDB,
};
