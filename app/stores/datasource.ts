import service from '@app/config/service';
import { IDatasourceAdd, IDatasourceType, IDatasourceUpdate } from '@app/interfaces/datasource';
import { getRootStore } from '.';

export class DatasourceStore {

  get rootStore() {
    return getRootStore();
  }

  update = (payload: Partial<DatasourceStore>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  addDataSource = async (payload: IDatasourceAdd) => {
    const { code } = await service.addDatasource(payload);
    return code === 0;
  };
  updateDataSource = async (payload: IDatasourceUpdate) => {
    const { code } = await service.updateDatasource(payload);
    return code === 0;
  };
  getDatasourceList = async (payload?: { type?: IDatasourceType }) => {
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
    id: number,
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

