import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/*', controller.home.index);
  router.post('/import', controller.home.import);
  router.post('/log', controller.home.readLog);
};
