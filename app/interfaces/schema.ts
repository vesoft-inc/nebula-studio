export interface IIndex {
  indexName: string;
  props: IField[];
}
export interface ITree {
  name: string;
  indexes: IIndex[];
}

export interface IField {
  Field: string;
  Type: string;
}

export interface ISpace {
  Charset?: string;
  Collate?: string;
  Comment?: string;
  ID?: number;
  Name: string;
  'Partition Number'?: number;
  'Replica Factor'?: number;
  'Vid Type'?: string;
}

export interface ITag {
  name: string;
  fields: IField[];
}
export interface IEdge {
  name: string;
  fields: IField[];
}
export interface IIndexList {
  name: string;
  owner: string;
  comment?: string | null;
  fields: IField[];
}

export interface IProperty {
  name: string;
  type: string;
  value?: string;
  allowNull?: boolean;
  fixedLength?: string;
  comment?: string;
  showType?: string;
}

export type IndexType = ISchemaEnum.Tag | ISchemaEnum.Edge;
export type ISchemaType = ISchemaEnum.Tag | ISchemaEnum.Edge;
export type AlterType = 'ADD' | 'DROP' | 'CHANGE' | 'TTL' | 'COMMENT';
export interface IAlterConfig {
  fields?: IProperty[];
  comment?: string;
  ttl?: {
    col?: string;
    duration?: string;
  };
}

export interface IAlterForm {
  type: ISchemaType;
  name: string;
  action: AlterType;
  config: IAlterConfig;
}

export enum ISchemaEnum {
  Tag = 'tag',
  Edge = 'edge',
}
export enum IJobStatus {
  Queue = 'QUEUE',
  Running = 'RUNNING',
  Finished = 'FINISHED',
  Failed = 'FAILED',
  Stopped = 'STOPPED',
  Removed = 'REMOVED',
}
