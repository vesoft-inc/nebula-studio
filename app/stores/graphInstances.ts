import { action, makeAutoObservable, observable } from 'mobx';
import { omit } from 'lodash';
import { GraphStore } from './graph';
export class GraphInstances {
  graphs: {
    [id: string]: GraphStore
  } = {};
  
  constructor() {
    makeAutoObservable(this, {
      graphs: observable,
      clearGraph: action
    });
  }

  clearGraph = (uuid) => {
    this.graphs = omit(this.graphs, [uuid]);
  }
  initGraph = async (params: { 
    container: HTMLElement, 
    id: string,
    data: {
      vertexes: any;
      edges: any
    }
  }) => {
    const { container, id, data } = params;
    const graph = new GraphStore();
    graph.initGraph({
      container
    });
    this.graphs[id] = graph;
    await graph.getExploreInfo({ data });
  };
}

const graphInstancesStore = new GraphInstances();
export default graphInstancesStore;
