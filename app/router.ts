import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.post('/api/import/import', controller.import.import);
  router.get('/api/import/log', controller.import.readLog);
  router.get('/api/import/refresh', controller.import.refresh);
  router.delete('/api/import/process', controller.import.killProcesss);
  router.get(/^(?!^\/api\/)/, controller.home.index);
};
