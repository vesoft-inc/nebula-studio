import { RcFile } from 'antd/lib/upload';

export enum ITaskStatus {
  'Finished' = 'Success',
  'Stoped' = 'Stopped',
  'Processing' = 'Running',
  'NotExisted' = 'NotExisted',
  'Aborted' = 'Failed',
  'Pending' = 'Pending',
}

export interface ITaskStats {
  processedBytes: number;
  totalBytes: number;
  failedRecords: number;
  totalRecords: number;
  failedRequest: number;
  totalRequest: number;
  totalLatency: number;
  totalRespTime: number;
  /* The number of nodes and edges that have failed to be processed. */
  failedProcessed: number; 
  /* 123. */
  totalProcessed: number; 
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
  s3Config?: IS3Config;
  sftpConfig?: ISftpConfig;
  /** remote config id */
  datasourceId?: number;
  /** remote path */
  path?: string;
}

export interface IS3Config {
  region: string;
  endpoint: string;
  accessKey: string;
  accessSecret: string;
  bucket: string;
  token?: string;
  key: string;
}

export interface ISftpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  path: string;
  keyFile?: string;
  keyData?: string;
  passPhrase?: string;
}
export interface IBasicConfig {
  taskName: string;
  address: string[];
  batchSize?: string;
  concurrency?: string;
  retry?: string;
  readerConcurrency?: string;
  importerConcurrency?: string;
}

export interface ILogDimension {
  space: string;
  id: number;
  status: ITaskStatus;
}

export interface StudioFile extends RcFile {
  path?: string;
  withHeader?: boolean;
  delimiter?: string;
  sample?: string;
  content?: any[];
}