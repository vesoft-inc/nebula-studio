import { makeAutoObservable, action, observable, runInAction } from 'mobx';
import service from '@appv2/config/service';
import { message } from 'antd';
import intl from 'react-intl-universal';

export class FilesStore {
  uploadDir: string = '';
  fileList: any[] = [];
  constructor() {
    makeAutoObservable(this, {
      uploadDir: observable,
      fileList: observable,

      update: action,
    });
  }

  update = (payload: Record<string, any>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  asyncGetFiles = async () => {
    const { code, data } = (await service.getFiles()) as any;
    if (code === 0 && data) {
      this.update({
        fileList: data,
      });
    }
  };
  asyncUploadFile = async (payload: Record<string, unknown>) => {
    const { data, config } = payload;
    const res = (await service.uploadFiles(data, config)) as any;
    return res;
  };

  asyncDeleteFile = async (index: number) => {
    const res: any = await service.deteleFile({
      filename: this.fileList[index].name,
    })
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'))
      runInAction(() => {
        this.fileList = this.fileList.filter((_, i) => i !== index);
      });
    }
  };


  asyncGetUploadDir = async () => {
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

