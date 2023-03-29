export enum IDatasourceType {
  'S3' = 's3',
  'SFTP' = 'sftp',
  'Local' = 'local'
}
export enum IS3Platform {
  'AWS' = 'aws',
  'OSS' = 'oss',
  'Customize' = 'customize',
  'Tecent' = 'cos'
}

export type IDatasourceAdd = Omit<IDatasourceItem, 'id' | 'createTime'>;
export type IDatasourceUpdate = Omit<IDatasourceItem, 'createTime'>;

export interface IDatasourceItem {
  id: number;
  name: string;
  type: IDatasourceType;
  platform?: string;
  createTime: string;
  s3Config?: {
    accessKey: string;
    accessSecret?: string;
    endpoint: string;
    bucket: string;
    region?: string;
  };
  sftpConfig?: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
}