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
  serialNumber: number;
  Name: string;
  ID: number;
  Charset: string;
  Collate: string;
  'Partition Number': string;
  'Replica Factor': string;
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
  comment?: string;
  fields: IField[];
}

export interface IProperty {
  name: string;
  type: string;
  value?: string;
  allowNull?: boolean;
  fixedLength?: string;
}

export type IndexType = 'TAG' | 'EDGE';
export type AlterType = 'ADD' | 'DROP' | 'CHANGE' | 'TTL' | 'COMMENT';
export interface IAlterConfig {
  fields?: IProperty[];
  comment?: string;
  ttl?: {
    col?: string;
    duration?: string;
  };
}