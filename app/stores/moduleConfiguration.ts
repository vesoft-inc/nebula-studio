import { ES3Platform, IDatasourceType } from '@app/interfaces/datasource';

export interface IModuleConfiguration {
  readonly schema?: {
    /** if support create space in studio */
    supportCreateSpace?: boolean;
  };
  readonly dataImport?: {
    /** if support template import */
    supportTemplate?: boolean;
    /** if support task config download */
    supportConfigDownload?: boolean;
    /** if support task log download */
    supportLogDownload?: boolean;
    /** if need password confirm before import */
    needPwdConfirm?: boolean;
    /** support datasource type list */
    supportDatasourceType?: IDatasourceType[];
    /** support s3 platform list */
    supportS3Platform?: ES3Platform[];
    /** if support more config when import */
    supportMoreConfig?: boolean;
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
