import { action, makeObservable, observable, runInAction } from 'mobx';
import service from '@app/config/service';
import { message } from 'antd';
import { getI18n } from '@vesoft-inc/i18n';
import { StudioFile } from '@app/interfaces/import';
const { intl } = getI18n();

export class FilesStore {
  fileList: any[] = [];
  constructor() {
    makeObservable(this, {
      fileList: observable,

      update: action,
    });
  }

  update = (payload: Record<string, any>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  resetModel = () => {
    const shadowStore = new FilesStore();
    for (const key in shadowStore) {
      if (typeof shadowStore[key] !== 'function') {
        this[key] = shadowStore[key];
      }
    }
  };

  getFiles = async () => {
    const { code, data } = (await service.getFiles()) as any;
    if (code === 0 && data) {
      this.update({
        fileList: data.list || [],
      });
    }
  };
  uploadFile = async (files: StudioFile[]) => {
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    const data = new FormData();
    files.forEach(file => {
      data.append('file', file);
      data.append('config', JSON.stringify({
        name: file.name,
        delimiter: file.delimiter || ',',
        withHeader: file.withHeader || false,
      }));
    });
    const res = (await service.uploadFiles(data, config)) as any;
    return res;
  };

  deleteFile = async (names: string[]) => {
    const res: any = await service.deteleFile({
      names
    });
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      runInAction(() => {
        this.fileList = this.fileList.filter((item) => !names.includes(item.name));
      });
    }
  };
}

const filesStore = new FilesStore();

export default filesStore;

