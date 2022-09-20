import { LinkObject, NodeObject } from '@vesoft-inc/force-graph';

export interface IDataMap {
  [key: string]: NodeObject | LinkObject;
}

export interface Pointer {
  top: number;
  left: number;
  event?: any;
  node?: NodeObject;
  showContextMenu?: boolean;
  hideContextMenu?: boolean;
}
