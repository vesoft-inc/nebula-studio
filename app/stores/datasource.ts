import { makeAutoObservable, observable } from 'mobx';
import service from '@app/config/service';
import { getRootStore } from '.';

export class DatasourceStore {
  datasourceList = [];
  constructor() {
    makeAutoObservable(this, {
      datasourceList: observable,
    });
  }

  get rootStore() {
    return getRootStore();
  }

  update = (payload: Partial<DatasourceStore>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  addDataSource = async (payload) => {
    const { code } = await service.addDatasource(payload);
    return code === 0;
  };
  getDatasourceList = async (payload?: { type?: string }) => {
    const { code, data } = await service.getDatasourceList(payload);
    if(code === 0) {
      return data.list;
    }
  };
  deleteDataSource = async (id: number) => {
    const { code } = await service.deleteDatasource(id);
    return code === 0;
  };
  batchDeleteDatasource = async (ids: number[]) => {
    const { code } = await service.batchDeleteDatasource({ ids });
    return code === 0;
  };
  getDatasourceDetail = async (payload: {
    id: number,
    path?: string,
  }) => {
    const { id, path } = payload;
    const { code, data } = await service.getDatasourceDetail({ id, path });
    if(code === 0) {
      return data.list;
    }
  };
  previewFile = async (payload: {
    id: string,
    path?: string,
  }) => {
    const { id, path } = payload;
    const { code, data } = await service.previewFile({ id, path });
    if(code === 0) {
      return data;
    }
  };
}

const datasourceStore = new DatasourceStore();

export default datasourceStore;

