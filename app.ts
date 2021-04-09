import { Application } from 'egg';

export default (app: Application) => {
  // comment for rpm
  //if (process.env.NODE_ENV === 'development') {
  //  app.config.coreMiddleware.unshift('proxy');
  //}
  app.config.coreMiddleware.unshift('proxy');
};
