import common from './common';
import login from './login';

const resource = { common, login };

export type Resource = typeof resource;

export default resource;
