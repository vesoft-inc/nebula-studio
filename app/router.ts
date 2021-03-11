import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.post('/api/import/import', controller.import.import);
  router.get('/api/import/log', controller.import.readLog);
  router.post('/api/import/config', controller.import.createConfigFile);
  router.post('/api/import/finish', controller.import.callback);
  router.get('/api/import/working_dir', controller.import.getWorkingDir);
  router.get('/api/app', controller.home.getAppInfo);

  // file
  router.resources('testFile', '/api/test/files', controller.testFiles);
  router.resources('file', '/api/files', controller.files);
  router.post('/api/files/upload', controller.files.upload);
  if (1) {
    router.get(/^(?!^\/api\/)/, controller.home.index);
  }
};
