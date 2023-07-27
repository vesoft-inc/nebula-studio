import { makeAutoObservable } from 'mobx';
import { ES3Platform, IDatasourceType } from '@app/interfaces/datasource';

export class ModuleConfigurationStore {
  schema = {
    supportCreateSpace: true,
  };
  import = {
    supportTemplate: true,
    supportConfigDownload: true,
    supportLogDownload: true,
    needPwdConfirm: true,
    supportDatasourceType: [IDatasourceType.Local, IDatasourceType.S3, IDatasourceType.SFTP],
    supportS3Platform: [ES3Platform.AWS, ES3Platform.OSS, ES3Platform.Tecent, ES3Platform.Customize],
    supportMoreConfig: true,
  };
  constructor() {
    makeAutoObservable(this);
  }
}

const moduleConfigurationStore = new ModuleConfigurationStore();

export default moduleConfigurationStore;
