export enum IDatasourceType {
  's3' = 's3',
  'sftp' = 'sftp',
  'local' = 'local'
}
export enum IS3Platform {
  'aws' = 'aws',
  'oss' = 'oss',
  'customize' = 'customize',
  'tecent' = 'tecent'
}

export interface IDatasourceAdd {
  name: string;
  type: IDatasourceType;
  platform?: string;
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
export interface IDatasourceUpdate extends IDatasourceAdd {
  id: number;
}