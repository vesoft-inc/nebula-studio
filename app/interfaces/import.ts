import { RcFile } from 'antd/lib/upload';

export enum ITaskStatus {
  'StatusFinished' = 'Success',
  'StatusStoped' = 'Stopped',
  'StatusProcessing' = 'Running',
  'StatusNotExisted' = 'NotExisted',
  'StatusAborted' = 'Failed',
  'StatusPending' = 'Pending',
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

export interface IPropertyProps {
  name: string;
  type: string;
  isDefault: boolean;
  allowNull: boolean;
  mapping?: number
}

export interface IImportFile {
  name: string;
  content: string[];
  withHeader?: boolean;
  delimiter?: string;
}

export interface IBasicConfig {
  taskName: string;
  address: string[];
  batchSize?: string;
  concurrency?: string;
  retry?: string;
  channelBufferSize?: string;
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