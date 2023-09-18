import { makeAutoObservable, observable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import service from '@app/config/service';
import { IBasicConfig, ITaskItem, IImportFile, IPropertyProps } from '@app/interfaces/import';
import { ISchemaEnum } from '@app/interfaces/schema';
import { configToJson } from '@app/utils/import';
import { isEmpty } from '@app/utils/function';
import { trackEvent } from '@app/utils/stat';
import { message } from 'antd';
import { getI18n } from '@vesoft-inc/i18n';
import { getRootStore } from '.';
const { intl } = getI18n();

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
  vidIndex = observable.array<number>([]);
  vidFunction?: string;
  vidPrefix?: string;
  vidSuffix?: string;
  constructor({ file, props, vidIndex, vidFunction, vidPrefix, vidSuffix }: Partial<TagFileItem>) {
    makeAutoObservable(this);
    this.file = file;
    this.props.replace(props);
    this.vidIndex.replace(vidIndex);
    this.vidFunction = vidFunction;
    this.vidPrefix = vidPrefix;
    this.vidSuffix = vidSuffix;
  }

  update = (payload: Partial<TagFileItem>) => {
    Object.keys(payload).forEach(
      (key) => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]),
    );
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
  srcIdIndex = observable.array<number>([]);
  dstIdIndex = observable.array<number>([]);
  srcIdFunction?: string;
  dstIdFunction?: string;
  srcIdPrefix?: string;
  dstIdPrefix?: string;
  srcIdSuffix?: string;
  dstIdSuffix?: string;
  constructor({
    file,
    props,
    srcIdFunction,
    srcIdIndex,
    srcIdSuffix,
    srcIdPrefix,
    dstIdFunction,
    dstIdIndex,
    dstIdPrefix,
    dstIdSuffix,
  }: Partial<EdgeFileItem>) {
    makeAutoObservable(this);
    this.file = file;
    this.props.replace(props);
    this.srcIdIndex.replace(srcIdIndex);
    this.dstIdIndex.replace(dstIdIndex);
    this.srcIdFunction = srcIdFunction;
    this.dstIdFunction = dstIdFunction;
    this.srcIdPrefix = srcIdPrefix;
    this.dstIdPrefix = dstIdPrefix;
    this.srcIdSuffix = srcIdSuffix;
    this.dstIdSuffix = dstIdSuffix;
  }
  update = (payload: Partial<EdgeFileItem>) => {
    Object.keys(payload).forEach(
      (key) => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]),
    );
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

  constructor({ name, type, props, files }: { type: T; name?: string; props?: IPropertyProps[]; files?: F[] }) {
    makeAutoObservable(this);
    this.type = type;
    this.name = name;
    this.props.replace(props);
    this.files.replace(files);
  }

  addFileItem = (item: F) => this.files.push(item);

  deleteFileItem = (fileItem: F) => this.files.remove(fileItem);

  resetFileItem = (index: number, item: any) => {
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
  taskList: {
    list: ITaskItem[];
    total: number;
  } = {
    list: [],
    total: 0,
  };
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
    Object.keys(payload).forEach(
      (key) => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]),
    );
  };

  getTaskList = async (filter: { page: number; pageSize: number; space: string }) => {
    const { code, data } = await service.getTaskList(filter);
    if (code === 0 && data) {
      this.update({
        taskList: data,
      });
    }
  };

  getLogs = async (id: string) => {
    const { code, data } = (await service.getTaskLogs({ id })) as any;
    return { code, data };
  };
  saveTaskDraft = async () => {
    const { currentSpace } = this.rootStore.schema;
    const rawConfig = {
      basicConfig: this.basicConfig,
      tagConfig: this.tagConfig,
      edgeConfig: this.edgeConfig,
    };
    const { code } = (await service.saveTaskDraft({
      name: this.basicConfig.taskName,
      space: currentSpace,
      rawConfig: JSON.stringify(rawConfig),
    })) as any;
    return code;
  };
  updateTaskDraft = async (id: string) => {
    const { currentSpace } = this.rootStore.schema;
    const rawConfig = {
      basicConfig: this.basicConfig,
      tagConfig: this.tagConfig,
      edgeConfig: this.edgeConfig,
    };
    const { code } = (await service.updateTaskDraft({
      id,
      name: this.basicConfig.taskName,
      space: currentSpace,
      rawConfig: JSON.stringify(rawConfig),
    })) as any;
    return code;
  };
  validateResource = async (resource) => {
    const cfg = typeof resource === 'string' ? JSON.parse(resource) : resource;
    const { tagConfig, edgeConfig } = cfg;
    const files = await this.rootStore.files.getFiles();
    const datasources = await this.rootStore.datasource.getDatasourceList();
    const missingResources = [];
    const missingFiles = [];
    [tagConfig, edgeConfig].forEach((cfg) => {
      cfg.forEach((item) => {
        item.files.forEach((fileCfg) => {
          const file = fileCfg.file;
          if (file.datasourceId !== undefined) {
            if (datasources.filter((i) => i.id === file.datasourceId).length === 0) {
              missingResources.push(file.name);
            }
          } else {
            if (files.filter((i) => i.name === file.name).length === 0) {
              missingFiles.push(file.name);
            }
          }
        });
      });
    });
    if (missingFiles.length > 0) {
      message.error(intl.get('import.fileMissing', { files: missingFiles.join(',') }));
      return false;
    }
    if (missingResources.length > 0) {
      message.error(intl.get('import.datasourceMissing', { files: missingResources.join(',') }));
      return false;
    }
  };
  importTask = async (params: {
    id?: string;
    config?: {
      basicConfig: IBasicConfig;
      tagConfig: ITagItem[];
      edgeConfig: IEdgeItem[];
      space: string;
      spaceVidType: string;
    };
    template?: any;
    name: string;
    password?: string;
    type?: 'create' | 'rebuild' | 'rerun';
  }) => {
    const { template, name, password, id, config, type } = params;
    let _config;
    let rawConfig;
    if (template) {
      // template import
      _config = template;
      rawConfig = template;
    } else {
      const { basicConfig, tagConfig, edgeConfig, space, spaceVidType } = config;
      if (id !== undefined || type === 'rerun' || type === 'rebuild') {
        // id: import an existed draft task
        // rebuild: edit old task and save as new task
        // formData: rerun task directly
        // validate resource，maybe the resource has been deleted
        const isValid = await this.validateResource({ tagConfig, edgeConfig });
        if (isValid === false) {
          return;
        }
      }
      const { username } = this.rootStore.global;
      _config = configToJson({
        ...basicConfig,
        space,
        tagConfig,
        edgeConfig,
        username,
        password,
        spaceVidType,
      });
      rawConfig = {
        basicConfig,
        tagConfig,
        edgeConfig,
      };
    }
    const { code } = (await service.importData(
      {
        id,
        config: _config,
        name,
        rawConfig: JSON.stringify(rawConfig),
      },
      {
        trackEventConfig: 'import',
        action: template ? 'template_import' : 'import',
      },
    )) as any;
    return code;
  };

  stopTask = async (id: string) => {
    const res = await service.stopImportTask(id, {
      trackEventConfig: 'import',
      action: 'stop_task',
    });
    return res;
  };

  deleteTask = async (id: string) => {
    const res = await service.deleteImportTask(id, {
      trackEventConfig: 'import',
      action: 'delete_task',
    });
    return res;
  };

  downloadTaskConfig = async (id: string) => {
    const link = document.createElement('a');
    link.href = service.getTaskConfig(id);
    link.download = `config.yml`;
    link.click();
    trackEvent('import', 'download_task_config');
  };

  downloadTaskLog = async (params: { id: string; name: string }) => {
    const { id, name } = params;
    const link = document.createElement('a');
    link.href = service.getTaskLog(id) + `?name=${name}`;
    link.download = `log.yml`;
    link.click();
    trackEvent('import', 'download_task_log');
  };

  getLogDetail = async (params: { id: string }) => {
    const { code, data } = await service.getLogDetail(params);
    if (code === 0) {
      return data;
    }
    return null;
  };

  setDraft = (cfg: { basicConfig: IBasicConfig; tagConfig: ITagItem[]; edgeConfig: IEdgeItem[] }) => {
    const { basicConfig, tagConfig, edgeConfig } = cfg;
    this.validateResource(cfg);
    this.updateBasicConfig(basicConfig);
    tagConfig.forEach((item) => {
      const { name, props, files } = item;
      const _files = files.map((file) => new TagFileItem(file));
      const tagItem = new ImportSchemaConfigItem({ type: ISchemaEnum.Tag, name, props, files: _files });
      this.tagConfig.push(tagItem);
    });
    edgeConfig.forEach((item) => {
      const { name, props, files } = item;
      const _files = files.map((file) => new EdgeFileItem(file));
      const edgeItem = new ImportSchemaConfigItem({ type: ISchemaEnum.Edge, name, props, files: _files });
      this.edgeConfig.push(edgeItem);
    });
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

  updateBasicConfig = <T extends keyof IBasicConfig>(payload: { [K in T]?: IBasicConfig[K] }) => {
    Object.keys(payload).forEach((key) => {
      if (isEmpty(payload[key])) {
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
      fields.forEach((field) => {
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
    return code === 0 ? data.tables.map((attr) => handlePropertyMap(attr, defaultValueFields)) : [];
  };

  getEdgeProps = async (edgeType: string) => {
    const { schema } = this.rootStore;
    const { getTagOrEdgeInfo, getTagOrEdgeDetail } = schema;
    const { code, data } = await getTagOrEdgeInfo(ISchemaEnum.Edge, edgeType);
    const createEdgeGQL = await getTagOrEdgeDetail(ISchemaEnum.Edge, edgeType);
    const defaultValueFields: any[] = [];
    if (createEdgeGQL) {
      const fields = createEdgeGQL.split(/\n|\r\n/);
      fields.forEach((field) => {
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
          ...data.tables.map((item) => handlePropertyMap(item, defaultValueFields)),
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
