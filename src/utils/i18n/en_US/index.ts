import common from './common';
import login from './login';
import graphtype from './graphtype';
import route from './route';

const resource = { common, login, graphtype, route };

export type Resource = typeof resource;

export default resource;
