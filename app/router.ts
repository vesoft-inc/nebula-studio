import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/*', controller.home.index);
  router.post('/import', controller.home.import);
  router.post('/log', controller.home.readLog);
  router.post('/refinish', controller.home.refinish);
  router.post('/process_kill', controller.home.processKill);
};
