import { ES3Platform, IDatasourceType } from '@app/interfaces/datasource';

export interface IModuleConfiguration {
  readonly schema?: {
    supportCreateSpace?: boolean; // if support create space in studio
  };
  readonly dataImport?: {
    supportTemplate?: boolean; // if support template import
    supportConfigDownload?: boolean; // if support task config download
    supportLogDownload?: boolean; // if support task log download
    needPwdConfirm?: boolean; // if need password confirm before import
    supportDatasourceType?: IDatasourceType[]; // support datasource type list
    supportS3Platform?: ES3Platform[]; // support s3 platform list
    supportMoreConfig?: boolean; // if support more config when import
  };
}

export class ModuleConfigurationStore implements IModuleConfiguration {
  schema = {
    supportCreateSpace: true,
  };
  dataImport = {
    supportTemplate: true,
    supportConfigDownload: true,
    supportLogDownload: true,
    needPwdConfirm: true,
    supportDatasourceType: [IDatasourceType.Local, IDatasourceType.S3, IDatasourceType.SFTP],
    supportS3Platform: [ES3Platform.AWS, ES3Platform.OSS, ES3Platform.Tecent, ES3Platform.Customize],
    supportMoreConfig: true,
  };
}

const moduleConfigurationStore = new ModuleConfigurationStore();

export default moduleConfigurationStore;
