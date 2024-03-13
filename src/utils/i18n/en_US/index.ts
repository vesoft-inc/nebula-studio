import common from './common';
import login from './login';
import graphtype from './graphtype';
import route from './route';
import console from './console';

const resource = { common, login, graphtype, route, console };

export type Resource = typeof resource;

export default resource;
