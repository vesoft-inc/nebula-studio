import { action, makeObservable, observable, runInAction } from 'mobx';
import service from '@app/config/service';
import { message } from 'antd';
import intl from 'react-intl-universal';

export class FilesStore {
  uploadDir: string = '';
  fileList: any[] = [];
  constructor() {
    makeObservable(this, {
      uploadDir: observable,
      fileList: observable,

      update: action,
    });
  }

  update = (payload: Record<string, any>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  getFiles = async () => {
    const { code, data } = (await service.getFiles()) as any;
    if (code === 0 && data) {
      this.update({
        fileList: data,
      });
    }
  };
  uploadFile = async (files: any) => {
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    const data = new FormData();
    files.forEach(file => {
      data.append('file', file);
    })
    const res = (await service.uploadFiles(data, config)) as any;
    return res;
  };

  deleteFile = async (name: string) => {
    const res: any = await service.deteleFile({
      filename: name,
    });
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      runInAction(() => {
        this.fileList = this.fileList.filter((item) => item.name !== name);
      });
    }
  };


  getUploadDir = async () => {
    const { code, data } = (await service.getUploadDir()) as any;
    if (code === 0) {
      const { uploadDir } = data;
      this.update({
        uploadDir,
      });
    }
  };
}

const filesStore = new FilesStore();

export default filesStore;

