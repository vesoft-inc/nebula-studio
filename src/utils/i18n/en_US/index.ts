import common from './common';
import login from './login';
import graphtype from './graphtype';

const resource = { common, login, graphtype };

export type Resource = typeof resource;

export default resource;
