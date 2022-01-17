import * as d3 from 'd3';
export interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
  uuid: string;
  color: string;
  icon: string;
}

export interface IPath extends d3.SimulationLinkDatum<INode> {
  id: string;
  source: INode;
  target: INode;
  size: number;
  type: string;
  uuid: string;
}
