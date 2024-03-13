import { action, makeObservable, observable } from 'mobx';
import type { Graph, GraphType } from '@/interfaces';
import { execGql } from '@/services';
import { type RootStore } from '.';

export class ConsoleStore {
  rootStore?: RootStore;

  graphs = observable.array<Graph>([]);
  graphTypes = observable.array<GraphType>([]);

  constructor(rootStore?: RootStore) {
    makeObservable(this, {
      // observable properties
      graphs: observable.shallow,
      rootStore: observable.ref,

      // actions
      updateGraphs: action,
      updateGraphTypes: action,
    });
    this.rootStore = rootStore;
  }

  updateGraphs = (graphs: Graph[]) => this.graphs.replace(graphs);
  updateGraphTypes = (graphTypes: GraphType[]) => this.graphTypes.replace(graphTypes);

  getGraphTypes = async () => {
    const gql = `CALL show_graph_types() YIELD \`graph_type_name\` AS name CALL describe_graph_type(name) RETURN *`;
    const res = await execGql<{ tables: GraphType[] }>(gql);
    const graphTypes = res?.tables || [];
    // const graphTypeGroups = Object.groupBy(graphTypes, (item) => item.name);
    this.updateGraphTypes(graphTypes);
  };
}
