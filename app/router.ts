import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.post('/api/import/import', controller.import.import);
  router.post('/api/import/test', controller.import.testImport);
  router.get('/api/import/log', controller.import.readLog);
  router.get('/api/import/refresh', controller.import.refresh);
  router.delete('/api/import/process', controller.import.killProcesss);
  router.post('/api/import/config', controller.import.createConfigFile);
  router.post('/api/import/finish', controller.import.callback);
  router.get('/api/import/working_dir', controller.import.getWorkingDir);
  router.get(/^(?!^\/api\/)/, controller.home.index);
};
