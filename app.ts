import { Application } from 'egg';

export default (app: Application) => {
  //if (process.env.NODE_ENV === 'development') {
    app.config.coreMiddleware.unshift('proxy');
  //}
};
