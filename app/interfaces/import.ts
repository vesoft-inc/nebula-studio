
export enum ITaskStatus {
  'StatusFinished' = 'statusFinished',
  'StatusStoped' = 'statusStoped',
  'StatusProcessing' = 'statusProcessing',
  'StatusNotExisted' = 'statusNotExisted',
  'StatusAborted' = 'statusAborted',
}

export interface ITaskStats {
  totalBatches: number;
  totalBytes: number;
  totalImportedBytes: number;
  totalLatency: number;
  totalReqTime: number;
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
  stats: ITaskStats;
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

export interface ILogDimension {
  space: string;
  id: number;
  status: ITaskStatus;
}