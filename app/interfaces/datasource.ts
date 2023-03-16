export enum IDatasourceType {
  's3' = 's3',
  'sftp' = 'sftp',
  'local' = 'local'
}


export interface ICloudStorage {
  ipAddress: string;
  bucketName: string;
  accessKeyId: string;
  region: string;
  createTime: number;
}