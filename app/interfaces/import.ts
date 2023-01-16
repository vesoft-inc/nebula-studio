import { RcFile } from 'antd/lib/upload';
import { ISchemaEnum } from './schema';

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

export type IImportSchemaConfig<T extends ISchemaEnum = ISchemaEnum> = {
  _id: string;
  type: ISchemaEnum;
  name: string;
  props: IPropertyProps[];
  files: (T extends ISchemaEnum.Edge ? IEdgeFileMapping : ITagFileMapping)[];
}

// export type IImportSchemaConfig<T extends ISchemaEnum = ISchemaEnum, F extends unknown = unknown> = {
//   _id: string;
//   type: T;
//   name: string;
//   props: IPropertyProps[];
//   files: F[];
// }
export interface IImportFile {
  name: string;
  content: string[];
  withHeader?: boolean;
  delimiter?: string;
}


export interface IFileBasicMapping {
  file: IImportFile;
  props: IPropertyProps[]
}

export interface ITagFileMapping extends IFileBasicMapping {
  vidIndex?: number;
  vidFunction?: string;
  vidPrefix?: string
}

export interface IEdgeFileMapping extends IFileBasicMapping {
  srcIdIndex?: number;
  dstIdIndex?: number; 
  srcIdFunction?: string;
  dstIdFunction?: string;
  srcIdPrefix?: string;
  dstIdPrefix?: string;
}
export type IFileMapping = ITagFileMapping | IEdgeFileMapping;
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