import { ES3Platform, IDatasourceType } from '@app/interfaces/datasource';

export interface IModuleConfiguration {
  readonly schema?: {
    /** disable support create space in studio */
    disableCreateSpace?: boolean;
  };
  readonly dataImport?: {
    /** if support template import */
    disableTemplateImport?: boolean;
    /** if support task config download */
    disableConfigDownload?: boolean;
    /** if support task log download */
    disableLogDownload?: boolean;
    /** if need password confirm before import */
    needPwdConfirm?: boolean;
    /** support datasource type list */
    supportDatasourceType?: IDatasourceType[];
    /** support s3 platform list */
    supportS3Platform?: ES3Platform[];
    /** if support more config when import */
    disableConfigMore?: boolean;
  };
}

export class ModuleConfigurationStore implements IModuleConfiguration {
  schema = {
    disableCreateSpace: false,
  };
  dataImport = {
    disableTemplateImport: false,
    disableConfigDownload: false,
    disableLogDownload: false,
    needPwdConfirm: true,
    supportDatasourceType: [
      window.gConfig?.appInstance === 'single' && IDatasourceType.Local,
      IDatasourceType.S3,
      IDatasourceType.SFTP,
    ].filter(Boolean),
    supportS3Platform: [ES3Platform.AWS, ES3Platform.OSS, ES3Platform.Tecent, ES3Platform.Customize],
    disableConfigMore: false,
  };
}

const moduleConfigurationStore = new ModuleConfigurationStore();

export default moduleConfigurationStore;
