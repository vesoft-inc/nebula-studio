import { LinkObject, NodeObject } from '@app/components/ForceGraph';

export interface IDataMap {
  [key: string]: NodeObject | LinkObject;
}

export interface Pointer {
  top: number;
  left: number;
  event?: any;
  node?: NodeObject;
  showContextMenu?: boolean;
}
