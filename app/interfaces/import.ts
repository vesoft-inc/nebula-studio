
export enum ITaskStatus {
  'StatusFinished' = 'statusFinished',
  'StatusStoped' = 'statusStoped',
  'StatusProcessing' = 'statusProcessing',
  'StatusNotExisted' = 'statusNotExisted',
  'StatusAborted' = 'statusAborted',
}

export interface ITaskStats {
  totalLine: number;
  totalCount: number;
  numFailed: number;
  numReadFailed: number;
}
export interface ITaskItem {
  taskID: number;
  nebulaAddress: string;
  space: string;
  name: string;
  createdTime: number;
  updatedTime: number;
  user: string;
  taskStatus: ITaskStatus;
  taskMessage: string;
  statsQuery: ITaskStats;
}

export interface IVerticesConfig {
  name: string;
  file: any;
  tags: any[];
  idMapping: any;
}
export interface IEdgeConfig {
  name: string;
  file: any;
  props: any[];
  type: string;
}

export interface IBasicConfig {
  taskName: string;
  batchSize?: string;
}