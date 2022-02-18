import { action, makeAutoObservable, observable, runInAction } from 'mobx';
import service from '@appv2/config/service';
import { IBasicConfig, IEdgeConfig, ITaskItem, IVerticesConfig } from '@appv2/interfaces/import';
import { getRootStore } from '.';
export class ImportStore {
  taskList: ITaskItem[] = [];
  taskDir: string = '';
  verticesConfig: IVerticesConfig[] = [];
  edgesConfig: IEdgeConfig[] = [];

  basicConfig: IBasicConfig = { taskName: '' };
  constructor() {
    makeAutoObservable(this, {
      taskList: observable,
      taskDir: observable,
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

  asyncGetTaskList = async() => {
    const { code, data } = await service.handleImportAction({
      taskAction: 'actionQueryAll',
    });
    if (code === 0 && data) {
      this.update({
        taskList: data.results || [],
      });
    }
  };

  asyncGetTaskDir = async() => {
    const { code, data } = (await service.getTaskDir()) as any;
    if (code === 0) {
      const { taskDir } = data;
      this.update({
        taskDir,
      });
    }
  };
  
  importTask = async(config, name) => {
    const { code, data } = (await service.importData({
      configBody: config,
      configPath: '',
      name
    })) as any;
    if (code === 0) {
      this.update({
        taskId: data[0],
      });
    }
    return code;
  }

  stopTask = async(taskID: number) => {
    const res = await service.handleImportAction({
      taskID: taskID.toString(),
      taskAction: 'actionStop',
    });
    return res;
  }

  deleteTask = async(taskID: number) => {
    const res = await service.handleImportAction({
      taskID: taskID.toString(),
      taskAction: 'actionDel',
    });
    return res;
  }

  downloadTaskConfig = async(taskID: number) => {
    const link = document.createElement('a');
    link.href = `/api-nebula/task/import/config/${taskID}`;
    link.download = `config.yml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  asyncUpdateTagConfig = async(payload: { 
    tag: string; 
    tagIndex: number;
    configIndex: number;
  }) => {
    const { schema } = this.rootStore;
    const { getTagInfo, getTagDetail } = schema;
    const { tag, tagIndex, configIndex } = payload;
    const { code, data } = await getTagInfo(tag);
    const createTag = await getTagDetail(tag);
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

  updateEdgeConfig = async(payload: { edgeType?: string, index: number; }) => {
    const { edgeType, index } = payload;
    if(!edgeType) {
      this.edgesConfig = this.edgesConfig.splice(index, 1);
    } else {
      const { schema } = this.rootStore;
      const { getEdgeInfo, getEdgeDetail, spaceVidType } = schema;
      const { code, data } = await getEdgeInfo(edgeType);
      const createTag = await getEdgeDetail(edgeType);
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
      const tag = this.verticesConfig[configIndex].tags[tagIndex];
      tag.props[propIndex][field!] = value;
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
      this.edgesConfig[configIndex].props[propIndex][field] = value;
    }
  }
}

const importStore = new ImportStore();

export default importStore;

