import { makeAutoObservable, observable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import service from '@app/config/service';
import { IBasicConfig, ITaskItem, IImportFile, IPropertyProps } from '@app/interfaces/import';
import { ISchemaEnum } from '@app/interfaces/schema';
import { configToJson } from '@app/utils/import';
import { isEmpty } from '@app/utils/function';
import { getRootStore } from '.';

const handlePropertyMap = (item, defaultValueFields) => {
  const type = item.Type.startsWith('fixed_string') ? 'string' : item.Type.startsWith('int') ? 'int' : item.Type;
  return {
    name: item.Field,
    type,
    isDefault: defaultValueFields.includes(item.Field),
    allowNull: item.Null === 'YES',
    mapping: null,
  };
};

export class TagFileItem {
  file: IImportFile;
  props = observable.array<IPropertyProps>([]);
  vidIndex?: number;
  vidFunction?: string;

  constructor({ file, props }: { file?: IImportFile; props?: IPropertyProps[] }) {
    makeAutoObservable(this);
    file && (this.file = file);
    props && this.props.replace(props);
  }

  update = (payload: Partial<TagFileItem>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  updatePropItem = (index: number, payload: Partial<IPropertyProps>) => {
    this.props.splice(index, 1, {
      ...this.props[index],
      ...payload,
    });
  };
}
export class EdgeFileItem {
  file: IImportFile;
  props = observable.array<IPropertyProps>([]);
  srcIdIndex?: number;
  dstIdIndex?: number;
  srcIdFunction?: string;
  dstIdFunction?: string;

  constructor({ file, props }: { file?: IImportFile; props?: IPropertyProps[] }) {
    makeAutoObservable(this);
    file && (this.file = file);
    props && this.props.replace(props);
  }
  update = (payload: Partial<EdgeFileItem>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };

  updatePropItem = (index: number, payload: Partial<IPropertyProps>) => {
    this.props.splice(index, 1, {
      ...this.props[index],
      ...payload,
    });
  };
}
class ImportSchemaConfigItem<T extends ISchemaEnum, F = T extends ISchemaEnum.Edge ? EdgeFileItem : TagFileItem> {
  _id = uuidv4();
  type: T;
  name?: string;
  props = observable.array<IPropertyProps>([]);
  files = observable.array<F>([]);

  constructor({ name, type }: { type: T; name?: string }) {
    makeAutoObservable(this);
    this.type = type;
    this.name = name;
  }

  addFileItem = (item: F) => this.files.push(item);

  deleteFileItem = (fileItem: F) => this.files.remove(fileItem);

  resetFileItem = (index: number, item: F) => {
    // this.files.
    this.files.splice(index, 1, item);
  };

  resetConfigItem = (name: string, props: IPropertyProps[]) => {
    this.name = name;
    this.props.replace(props);
    this.files.replace([]);
  };
    
  addProp = (item: IPropertyProps) => this.props.push(item);

  deleteProp = (prop: IPropertyProps) => this.props.remove(prop);

  updateProp = (prop: IPropertyProps, payload: Partial<IPropertyProps>) =>
    Object.keys(payload).forEach((key) => (prop[key] = payload[key]));
}

export type ITagItem = ImportSchemaConfigItem<ISchemaEnum.Tag>;
export type IEdgeItem = ImportSchemaConfigItem<ISchemaEnum.Edge>;
export type ITagFileItem = TagFileItem;
export type IEdgeFileItem = EdgeFileItem;
export class ImportStore {
  taskList: ITaskItem[] = [];
  tagConfig = observable.array<ITagItem>([], { deep: false });
  edgeConfig = observable.array<IEdgeItem>([], { deep: false });
  basicConfig: IBasicConfig = { taskName: '', address: [] };
  constructor() {
    makeAutoObservable(this, {
      taskList: observable,
      basicConfig: observable,
    });
  }

  get rootStore() {
    return getRootStore();
  }

  update = (payload: Partial<ImportStore>) => {
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
  };
  
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
      const { username } = this.rootStore.global;
      _config = configToJson({
        ...this.basicConfig,
        space: currentSpace,
        tagConfig: this.tagConfig,
        edgeConfig: this.edgeConfig,
        username,
        password,
        spaceVidType
      });
    }
    const { code } = (await service.importData({
      config: _config,
      name
    })) as any;
    return code;
  };

  stopTask = async (id: number) => {
    const res = await service.stopImportTask(id);
    return res;
  };

  deleteTask = async (id: number) => {
    const res = await service.deleteImportTask(id);
    return res;
  };

  downloadTaskConfig = async (id: number) => {
    const link = document.createElement('a');
    link.href = service.getTaskConfig(id);
    link.download = `config.yml`;
    link.click();
  };

  downloadTaskLog = async (params: {
    id: string | number,
    name: string,
  }) => {
    const { id, name } = params;
    const link = document.createElement('a');
    link.href = service.getTaskLog(id) + `?name=${name}`;
    link.download = `log.yml`;
    link.click();
  };

  getLogDetail = async (params: {
    offset: number;
    limit?: number;
    id: string | number;
    file: string
  }) => {
    const { code, data } = await service.getLogDetail(params);
    if(code === 0) {
      return data.logs;
    }
    return null;
  };

  addTagConfig = () => this.tagConfig.unshift(new ImportSchemaConfigItem({ type: ISchemaEnum.Tag }));
  deleteTagConfig = (item: ITagItem) => this.tagConfig.remove(item);

  addEdgeConfig = () => this.edgeConfig.unshift(new ImportSchemaConfigItem({ type: ISchemaEnum.Edge }));
  deleteEdgeConfig = (item: IEdgeItem) => this.edgeConfig.remove(item);

  updateConfigItemName = async (item: ITagItem | IEdgeItem, name: string) => {
    const props = item.type === ISchemaEnum.Tag ? await this.getTagProps(name) : await this.getEdgeProps(name);
    runInAction(() => {
      item.resetConfigItem(name, props);
    });
  };

  updateBasicConfig = <T extends keyof IBasicConfig>(payload: { [K in T]?: Person[K] }) => {
    Object.keys(payload).forEach(key => {
      if(isEmpty(payload[key])) {
        delete this.basicConfig[key];
      } else {
        this.basicConfig[key] = payload[key];
      }
    });
  };

  getTagProps = async (tag: string) => {
    const { schema } = this.rootStore;
    const { getTagOrEdgeInfo, getTagOrEdgeDetail } = schema;
    const { code, data } = await getTagOrEdgeInfo(ISchemaEnum.Tag, tag);
    const createTagGQL = await getTagOrEdgeDetail(ISchemaEnum.Tag, tag);
    const defaultValueFields: any[] = [];
    if (createTagGQL) {
      const fields = createTagGQL.split(/\n|\r\n/);
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
    return code === 0 
      ? data.tables.map(attr => handlePropertyMap(attr, defaultValueFields))
      : [];
  };
  
  getEdgeProps = async (edgeType: string) => {
    const { schema } = this.rootStore;
    const { getTagOrEdgeInfo, getTagOrEdgeDetail } = schema;
    const { code, data } = await getTagOrEdgeInfo(ISchemaEnum.Edge, edgeType);
    const createEdgeGQL = await getTagOrEdgeDetail(ISchemaEnum.Edge, edgeType);
    const defaultValueFields: any[] = [];
    if (createEdgeGQL) {
      const fields = createEdgeGQL.split(/\n|\r\n/);
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
    return code !== 0 
      ? []
      : [
        ...data.tables.map(item => handlePropertyMap(item, defaultValueFields)),
        {
          name: 'rank',
          type: 'int',
          allowNull: true,
          mapping: null,
        },
      ];
  };
}

const importStore = new ImportStore();

export default importStore;

