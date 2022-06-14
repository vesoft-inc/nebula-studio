import { action, makeObservable, observable, runInAction } from 'mobx';
import service from '@app/config/service';
import { IBasicConfig, IEdgeConfig, ITaskItem, IVerticesConfig } from '@app/interfaces/import';
import { configToJson } from '@app/utils/import';
import { getRootStore } from '.';
export class ImportStore {
  taskList: ITaskItem[] = [];
  verticesConfig: IVerticesConfig[] = [];
  edgesConfig: IEdgeConfig[] = [];

  basicConfig: IBasicConfig = { taskName: '' };
  constructor() {
    makeObservable(this, {
      taskList: observable,
      verticesConfig: observable,
      edgesConfig: observable,
      basicConfig: observable,

      update: action,
      updateVerticesConfig: action,
      updateTagPropMapping: action,
      updateBasicConfig: action,
    });
  }

  get rootStore() {
    return getRootStore();
  }

  update = (payload: Record<string, any>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  getTaskList = async () => {
    const { code, data } = await service.getTaskList();
    if (code === 0 && data) {
      this.update({
        taskList: data.list || [],
      });
    }
  };

  getLogs = async (id: number) => {
    const { code, data } = (await service.getTaskLogs({ id })) as any;
    return { code, data };
  }
  
  importTask = async (params: {
    config?: any,
    name: string, 
    password?: string
  }) => {
    let _config;
    const { config, name, password } = params;
    if(config) {
      _config = config;
    } else {
      const { currentSpace, spaceVidType } = this.rootStore.schema;
      const { username, host } = this.rootStore.global;
      _config = configToJson({
        ...this.basicConfig,
        space: currentSpace,
        verticesConfig: this.verticesConfig,
        edgesConfig: this.edgesConfig,
        username,
        host,
        password,
        spaceVidType
      });
    }
    const { code } = (await service.importData({
      config: _config,
      name
    })) as any;
    return code;
  }

  stopTask = async (id: number) => {
    const res = await service.stopImportTask(id);
    return res;
  }

  deleteTask = async (id: number) => {
    const res = await service.deleteImportTask(id);
    return res;
  }

  downloadTaskConfig = async (id: number) => {
    const link = document.createElement('a');
    link.href = service.getTaskConfig(id);
    link.download = `config.yml`;
    link.click();
  }

  downloadTaskLog = async (params: {
    id: string | number,
    name: string,
  }) => {
    const { id, name } = params;
    const link = document.createElement('a');
    link.href = service.getTaskLog(id) + `?name=${name}`;
    link.download = `log.yml`;
    link.click();
  }

  getLogDetail = async (params: {
    offset: number;
    limit?: number;
    id: string | number;
    file: string
  }) => {
    const { code, data } = await service.getLogDetail(params);
    if(code === 0) {
      return data.logs
    }
    return null;
  }

  updateTagConfig = async (payload: { 
    tag: string; 
    tagIndex: number;
    configIndex: number;
  }) => {
    const { schema } = this.rootStore;
    const { getTagOrEdgeInfo, getTagOrEdgeDetail } = schema;
    const { tag, tagIndex, configIndex } = payload;
    const { code, data } = await getTagOrEdgeInfo('tag', tag);
    const createTag = await getTagOrEdgeDetail('tag', tag);
    const defaultValueFields: any[] = [];
    if (!!createTag) {
      const res =
        (createTag.data.tables && createTag.data.tables[0]['Create Tag']) ||
        '';
      const fields = res.split(/\n|\r\n/);
      fields.forEach(field => {
        const fieldArr = field.trim().split(/\s|\s+/);
        if (fieldArr.includes('default') || fieldArr.includes('DEFAULT')) {
          let defaultField = fieldArr[0];
          if (defaultField.includes('`')) {
            defaultField = defaultField.replace(/`/g, '');
          }
          defaultValueFields.push(defaultField);
        }
      });
    }
    if (code === 0) {
      const props = data.tables.map(attr => {
        return {
          name: attr.Field,
          type: attr.Type === 'int64' ? 'int' : attr.Type, // HACK: exec return int64 but importer only use int
          isDefault: defaultValueFields.includes(attr.Field),
          mapping: null,
        };
      });
      runInAction(() => {
        this.verticesConfig[configIndex].tags[tagIndex] = {
          name: tag,
          props
        };
      });
    }
  }

  updateBasicConfig = (key: string, value: any) => {
    this.basicConfig[key] = value;
  }

  updateEdgeConfig = async (payload: { edgeType?: string, index: number; }) => {
    const { edgeType, index } = payload;
    if(!edgeType) {
      this.edgesConfig.splice(index, 1);
    } else {
      const { schema } = this.rootStore;
      const { getTagOrEdgeInfo, getTagOrEdgeDetail, spaceVidType } = schema;
      const { code, data } = await getTagOrEdgeInfo('edge', edgeType);
      const createTag = await getTagOrEdgeDetail('edge', edgeType);
      const defaultValueFields: any[] = [];
      if (!!createTag) {
        const res =
          (createTag.data.tables && createTag.data.tables[0]['Create Edge']) ||
          '';
        const fields = res.split(/\n|\r\n/);
        fields.forEach(field => {
          const fieldArr = field.trim().split(/\s|\s+/);
          if (field.includes('default') || fieldArr.includes('DEFAULT')) {
            let defaultField = fieldArr[0];
            if (defaultField.includes('`')) {
              defaultField = defaultField.replace(/`/g, '');
            }
            defaultValueFields.push(defaultField);
          }
        });
      }
      if (code === 0) {
        const props = data.tables.map(item => {
          return {
            name: item.Field,
            type: item.Type === 'int64' ? 'int' : item.Type,
            isDefault: defaultValueFields.includes(item.Field),
            mapping: null,
          };
        });
        
        runInAction(() => {
          this.edgesConfig[index].type = edgeType;
          this.edgesConfig[index].props = [
            // each edge must have the three special prop srcId, dstId, rank，put them ahead
            {
              name: 'srcId',
              type: spaceVidType === 'INT64' ? 'int' : 'string',
              mapping: null,
            },
            {
              name: 'dstId',
              type: spaceVidType === 'INT64' ? 'int' : 'string',
              mapping: null,
            },
            {
              name: 'rank',
              type: 'int',
              mapping: null,
            },
            ...props,
          ];
        });
      }
    }
  }

  updateVerticesConfig = (payload: {
    index: number
    key?: string,
    value?: any
  }) => {
    const { index, key, value } = payload;
    if(key) {
      this.verticesConfig[index][key] = value;
    } else {
      this.verticesConfig.splice(index, 1);
    }
  }

  updateTagPropMapping = (payload: {
    configIndex: number,
    tagIndex: number,
    propIndex?: number,
    field?: string,
    value?: any
  }) => {
    const { configIndex, tagIndex, propIndex, field, value } = payload;
    if(propIndex === undefined) {
      const tags = this.verticesConfig[configIndex].tags;
      tags.splice(tagIndex, 1);
    } else {
      const tags = this.verticesConfig[configIndex].tags;
      const _tag = { ...tags[tagIndex] };
      _tag.props[propIndex][field!] = value;
      tags.splice(tagIndex, 1, _tag);
    }
  }

  updateEdgePropMapping = (payload: {
    configIndex,
    propIndex?,
    field?,
    value?
  }) => {
    const { configIndex, propIndex, field, value } = payload;
    if(propIndex === undefined) {
      this.edgesConfig[configIndex].type = '';
      this.edgesConfig[configIndex].props = [];
    } else {
      const _edge = { ...this.edgesConfig[configIndex] };
      _edge.props[propIndex][field] = value;
      this.edgesConfig[configIndex] = _edge;
    }
  }
}

const importStore = new ImportStore();

export default importStore;

