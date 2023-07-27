export enum IDatasourceType {
  'S3' = 's3',
  'SFTP' = 'sftp',
  'Local' = 'local',
}
export enum ES3Platform {
  'AWS' = 'aws',
  'OSS' = 'oss',
  'Customize' = 'customize',
  'Tecent' = 'cos',
}

export type IDatasourceAdd = Omit<IDatasourceItem, 'id' | 'createTime'>;
export type IDatasourceUpdate = Omit<IDatasourceItem, 'createTime'>;

export interface IDatasourceItem {
  id: string;
  name: string;
  type: IDatasourceType;
  platform?: string;
  createTime: string;
  s3Config?: {
    accessKeyID: string;
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
