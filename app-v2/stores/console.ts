import { makeAutoObservable, observable } from 'mobx';
import service from '@appv2/config/service';

export class ConsoleStore {
  runGQLLoading = false;
  currentGQL = 'SHOW SPACES;';
  result = {};

  constructor() {
    makeAutoObservable(this, {
      result: observable.ref,
    });
  }

  update = (param: Partial<ConsoleStore>) => {
    Object.keys(param).forEach(key => (this[key] = param[key]));
  };

  asyncRunGQL = async (gql: string) => {
    this.update({ runGQLLoading: true });
    try {
      const result = await service.execNGQL(
        { gql },
        {
          trackEventConfig: {
            category: 'console',
            action: 'run_gql',
          },
        },
      );
      this.update({ result, currentGQL: gql });
    } finally {
      window.setTimeout(() => this.update({ runGQLLoading: false }), 300);
    }
  };
}

const consoleStore = new ConsoleStore();

export default consoleStore;
