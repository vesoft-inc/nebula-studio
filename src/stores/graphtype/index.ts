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
  graphTypeList = observable.array<IGraphTypeItem>([]);
  draftList = observable.array<string>([]);

  constructor(rootStore?: RootStore) {
    makeAutoObservable(this, {
      rootStore: observable.ref,
      setLoading: action,
      schemaStore: observable.ref,
    });
    this.rootStore = rootStore;
  }

  getGraphTypeList = async () => {
    const gql = [
      'CALL show_graph_types() YIELD `graph_type_name` as gtn',
      'CALL show_graphs("") YIELD `graph_name` as name ',
      'CALL describe_graph(name) YIELD `graph_name`, `graph_type_name`',
      'RETURN graph_name, graph_type_name, gtn',
    ].join(' ');
    const res = await execGql<GQLResult<{ graph_name: string; graph_type_name: string; gtn: string }>>(gql);
    const tableData = res.data?.tables || [];
    const groups = Object.groupBy(tableData, (ele) => ele.gtn);
    const graphtypes = Object.keys(groups).map((graphTypeName: string) => ({
      name: graphTypeName,
      graphList:
        groups[graphTypeName]
          ?.filter(({ graph_type_name }) => graphTypeName === graph_type_name)
          .map((item) => item.graph_name) || [],
    }));
    this.updateGraphTypeList(graphtypes);
  };

  createGraphType = async (ngql: string) => {
    const res = await execGql<GQLResult>(ngql);
    return res;
  };

  createGraph = async (graphName: string, graphType: string, ifNotExists: boolean) => {
    const ngql = `CREATE GRAPH ${ifNotExists ? 'IF NOT EXISTS' : ''} ${graphName} :: ${graphType}`;
    const res = await execGql<GQLResult>(ngql);
    return res;
  };

  getCreateGraphTypeDDL = async (graphType: string) => {
    const ngql = `SHOW CREATE GRAPH TYPE ${graphType}`;
    const res = await execGql<string>(ngql);
    return res;
  };

  updateGraphTypeList = (graphTypeList: IGraphTypeItem[]) => {
    this.graphTypeList.replace(graphTypeList);
  };

  initSchemaStore = (graphtype?: string) => {
    this.schemaStore = new SchemaStore(this.rootStore, graphtype);
  };

  destroySchemaStore = () => {
    this.schemaStore?.disposeReaction();
    this.schemaStore = undefined;
  };

  setLoading = (loading: boolean) => {
    this.loading = loading;
  };
}

export default GraphTypeStore;
