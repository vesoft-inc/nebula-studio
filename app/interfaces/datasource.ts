export enum IRemoteType {
  'S3' = 's3',
  'Sftp' = 'sftp',
}


export interface ICloudStorage {
  ipAddress: string;
  bucketName: string;
  accessKeyId: string;
  region: string;
  createTime: number;
}