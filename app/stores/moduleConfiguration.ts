import { ES3Platform, IDatasourceType } from '@app/interfaces/datasource';

export interface IModuleConfigurationStore {
  readonly schema?: {
    supportCreateSpace?: boolean;
  };
  readonly dataImport?: {
    supportTemplate?: boolean;
    supportConfigDownload?: boolean;
    supportLogDownload?: boolean;
    needPwdConfirm?: boolean;
    supportDatasourceType?: IDatasourceType[];
    supportS3Platform?: ES3Platform[];
    supportMoreConfig?: boolean;
  };
}

export class ModuleConfigurationStore implements IModuleConfigurationStore {
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
