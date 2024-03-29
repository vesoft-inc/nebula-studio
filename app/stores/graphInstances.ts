import { action, makeAutoObservable, observable } from 'mobx';
import { omit } from 'lodash';
import { GraphStore } from './graph';
import { getRootStore } from '.';
export class GraphInstances {
  graphs: {
    [id: string]: GraphStore;
  } = {};

  constructor() {
    makeAutoObservable(this, {
      graphs: observable,
      clearGraph: action,
    });
  }
  get rootStore() {
    return getRootStore();
  }
  clearGraph = (uuid) => {
    this.graphs = omit(this.graphs, [uuid]);
  };
  initGraph = async (params: { container: HTMLElement; id: string; space: string; spaceVidType: string; }) => {
    const { container, id, space, spaceVidType } = params;
    const graph = new GraphStore({ space, spaceVidType });
    graph.initGraph({ container });
    this.graphs[id] = graph;
  };
  renderData = async (params: {
    graph: GraphStore;
    data: {
      vertexes: any;
      edges: any;
    };
  }) => {
    const { graph, data } = params;
    await graph.getExploreInfo({ data });
  };
}

const graphInstancesStore = new GraphInstances();
export default graphInstancesStore;
