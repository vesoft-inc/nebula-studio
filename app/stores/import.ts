import { makeAutoObservable, observable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import service from '@app/config/service';
import { IBasicConfig, ITaskItem, IImportSchemaConfig, IFileMapping, IImportFile, IPropertyProps } from '@app/interfaces/import';
import { configToJson } from '@app/utils/import';
import { ISchemaEnum } from '@app/interfaces/schema';
import { getRootStore } from '.';

const handlePropertyMap = (item, defaultValueFields) => {
  let type = item.Type;
  if(item.Type.startsWith('fixed_string')) {
    type = 'string';
  } else if (item.Type.startsWith('int')) {
    type = 'int';
  }
  return {
    name: item.Field,
    type,
    isDefault: defaultValueFields.includes(item.Field),
    allowNull: item.Null === 'YES',
    mapping: null,
  };
};

type TagConfig = IImportSchemaConfig<ISchemaEnum.Tag>;
type EdgeConfig = IImportSchemaConfig<ISchemaEnum.Edge>;

class ITagFileItemStore {
  file: IImportFile;
  props = observable.array<IPropertyProps>([]);
  vidIndex?: number;
  vidFunction?: string;
  vidPrefix?: string;

  constructor() {
    makeAutoObservable(this, {});
  }
  update = (payload: Partial<ITagFileItemStore>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };
}
class IEdgeFileItemStore {
  file: IImportFile;
  props = observable.array<IPropertyProps>([]);
  stcIdIndex?: number;
  dstIdIndex?: number;
  stcIdFunction?: string;
  dstIdFunction?: string;
  stcIdPrefix?: string;
  dstIdPrefix?: string;

  constructor() {
    makeAutoObservable(this, {});
  }
  update = (payload: Partial<IEdgeFileItemStore>) => {
    Object.keys(payload).forEach(key => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]));
  };
}
export class ImportStore {
  taskList: ITaskItem[] = [];
  tagConfig = observable.array<TagConfig>([]);
  edgesConfig = observable.array<EdgeConfig>([]);
  basicConfig: IBasicConfig = { taskName: '' };
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
      const { username, host } = this.rootStore.global;
      _config = configToJson({
        ...this.basicConfig,
        space: currentSpace,
        tagConfig: this.tagConfig,
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

  addConfigItem = (type: ISchemaEnum) => {
    const item = {
      _id: uuidv4(),
      name: undefined,
      files: [],
      props: [],
    };
    type === ISchemaEnum.Tag ? this.tagConfig.push({ ...item, type }) : this.edgesConfig.push({ ...item, type });
  };

  removeConfigItem = (data: IImportSchemaConfig) => {
    data.type === ISchemaEnum.Tag ? this.tagConfig.remove(data) : this.edgesConfig.remove(data);
  };

  updateConfigItemTarget = async (payload: {
    data: IImportSchemaConfig;
    value: string;
  }) => {
    const { data, value } = payload;
    const props = data.type === ISchemaEnum.Tag ? await this.getTagProps(value) : await this.getEdgeProps(value);
    runInAction(() => {
      data.name = value;
      data.props = props;
      data.files = [];
    });
  };

  addFileSource = (item: IImportSchemaConfig) => {
    item.files = [...item.files, {
      file: undefined,
      props: item.props,
    }];
  };

  removeFileSource = (data: IImportSchemaConfig, item: IFileMapping) => {
    data.files = data.files.filter(i => i !== item);
  };

  updateFileSource = (data: IFileMapping, file: IImportFile) => {
    const initialProps = data.props.map(item => ({
      ...item,
      mapping: undefined,
    }));
    Object.keys(data).forEach((key) => {
      if (key === 'file') {
        data[key] = file;
      } else if (key === 'props') {
        data[key] = initialProps;
      } else {
        delete data[key];
      }
    });
  };

  updateFileConfig = (data, key, value) => {
    data[key] = value;
  };
  updateFilePropMapping = (data, index, value) => {
    data.props = data.props.map((item, i) => i !== index ? item : {
      ...item,
      mapping: value,
    });
  };
  updateBasicConfig = (key: string, value: any) => {
    this.basicConfig[key] = value;
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
    const { getTagOrEdgeInfo, getTagOrEdgeDetail, spaceVidType } = schema;
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
        ...data.tables.map(item => handlePropertyMap(item, defaultValueFields)),
      ];
  };
}

const importStore = new ImportStore();

export default importStore;

