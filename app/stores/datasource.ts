import service from '@app/config/service';
import { IDatasourceAdd, IDatasourceGrantItem, IDatasourceType, IDatasourceUpdate } from '@app/interfaces/datasource';
import { makeAutoObservable } from 'mobx';
import { getRootStore } from '.';

export interface ICachedStore {
  loading?: boolean;
  options?: any[];
  directory?: any[];
  path?: string;
  activeId?: string;
  activeItem?: any;
}
export class DatasourceStore {
  cachedStore: ICachedStore = null;
  constructor() {
    makeAutoObservable(this);
  }
  get rootStore() {
    return getRootStore();
  }

  update = (payload: Partial<DatasourceStore>) => {
    Object.keys(payload).forEach(
      (key) => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]),
    );
  };

  addDataSource = async (payload: IDatasourceAdd) => {
    const { code } = await service.addDatasource(payload, {
      trackEventConfig: {
        category: 'datasource',
        action: `add_${payload.type}_datasource`,
      },
    });
    return code === 0;
  };
  updateDataSource = async (payload: IDatasourceUpdate) => {
    const { code } = await service.updateDatasource(payload, {
      trackEventConfig: {
        category: 'datasource',
        action: `update_${payload.type}_config`,
      },
    });
    return code === 0;
  };
  getDatasourceList = async (payload?: { type?: IDatasourceType }) => {
    const { code, data } = await service.getDatasourceList(payload);
    if (code === 0) {
      return data.list;
    }
  };
  deleteDataSource = async (id: string) => {
    const { code } = await service.deleteDatasource(id, {
      trackEventConfig: {
        category: 'datasource',
        action: 'delete_datasource',
      },
    });
    return code === 0;
  };
  batchDeleteDatasource = async (ids: string[]) => {
    const { code } = await service.batchDeleteDatasource(
      { ids },
      {
        trackEventConfig: {
          category: 'datasource',
          action: 'batch_delete_datasources',
        },
      },
    );
    return code === 0;
  };
  getDatasourceDetail = async (payload: { id: string; path?: string }) => {
    const { id, path } = payload;
    const { code, data } = await service.getDatasourceDetail({ id, path });
    if (code === 0) {
      return data.list;
    }
  };
  previewFile = async (payload: { id: string; path?: string }) => {
    const { id, path } = payload;
    const { code, data } = await service.previewFile({ id, path });
    if (code === 0) {
      return data;
    }
  };
  getDatasourceGrants = async (id: string): Promise<IDatasourceGrantItem[]> => {
    const { code, data } = await service.getDatasourceGrants(id);
    if (code === 0) {
      return data.list;
    }
    return [];
  };
  addDatasourceGrants = async (id: string, usernames: string[]) => {
    const { code } = await service.addDatasourceGrants({ id, usernames });
    return code === 0;
  };
  removeDatasourceGrants = async (id: string, usernames: string[]) => {
    const { code } = await service.removeDatasourceGrants({ id, usernames });
    return code === 0;
  };
}

const datasourceStore = new DatasourceStore();

export default datasourceStore;
