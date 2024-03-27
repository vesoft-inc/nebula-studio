import { action, makeAutoObservable, observable } from 'mobx';
import type { RootStore } from '..';
import SchemaStore from './schema';
import { GQLResult } from '@/interfaces/console';
import { execGql } from '@/services';

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
    makeAutoObservable(this, {
      rootStore: observable.ref,
      setLoading: action,
      graphTypeList: observable,
      schemaStore: observable.ref,
    });
    this.rootStore = rootStore;
  }

  getGraphTypeList = async () => {
    const gql = [
      'CALL show_graphs() YIELD `graph_name` as name',
      'CALL describe_graph(name) YIELD `graph_name`, `graph_type_name`',
      'RETURN graph_name, graph_type_name',
    ].join(' ');
    const res = await execGql<GQLResult<{ graph_name: string; graph_type_name: string }>>(gql);
    const graphTypes =
      res.data?.tables?.map((item) => ({ name: item.graph_name, typeName: item.graph_type_name })) || [];
    const groups = Object.groupBy(graphTypes || [], (ele) => ele.typeName);
    const graphtypes = Object.keys(groups).map((graphTypeName: string) => ({
      name: graphTypeName,
      graphList: groups[graphTypeName]?.map((item) => item.name) || [],
    }));
    this.updateGraphTypeList(graphtypes);
  };

  updateGraphTypeList = (graphTypeList: IGraphTypeItem[]) => {
    this.graphTypeList = graphTypeList;
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
