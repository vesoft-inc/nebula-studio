import { RcFile } from 'antd/lib/upload';

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
  id: number;
  address: string;
  space: string;
  name: string;
  createTime: number;
  updateTime: number;
  user: string;
  status: ITaskStatus;
  message: string;
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

export interface StudioFile extends RcFile {
  path?: string;
  withHeader?: boolean
}