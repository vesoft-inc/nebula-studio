import { action, makeObservable, observable } from 'mobx';
import type { RootStore } from '..';
import SchemaStore from './schema';

export interface IGraphTypeItem {
  name: string;
  graphList: string[];
}

class GraphTypeStore {
  rootStore?: RootStore;
  loading = false;

  schemaStore?: SchemaStore;

  graphTypeList: IGraphTypeItem[] = [];

  constructor(rootStore?: RootStore) {
    makeObservable(this, {
      rootStore: observable.ref,
      setLoading: action,
      graphTypeList: observable,
      schemaStore: observable.ref,
    });
    this.rootStore = rootStore;
  }

  getGraphTypeList = async () => {
    this.graphTypeList = await Promise.resolve([
      {
        name: 'graphtype-111',
        graphList: ['graph-1', 'graph-2', 'graph-2', 'graph-2'],
      },
      {
        name: 'graphtype-222',
        graphList: ['graph-3', 'graph-4'],
      },
    ]);
  };

  initSchemaStore = () => {
    this.schemaStore = new SchemaStore(this.rootStore);
  };

  destroySchemaStore = () => {
    this.schemaStore = undefined;
  };

  setLoading = (loading: boolean) => {
    this.loading = loading;
  };
}

export default GraphTypeStore;
