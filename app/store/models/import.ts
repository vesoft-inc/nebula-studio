import { createModel } from '@rematch/core';
import { message } from 'antd';
import intl from 'react-intl-universal';
import type { IRootModel } from '.';

import service from '#app/config/service';
import { handleKeyword } from '#app/utils/function';
import { configToJson, getGQLByConfig } from '#app/utils/import';

interface ITag {
  props: any[];
  name: string;
}

interface IVertexConfig {
  name: string;
  file: any;
  tags: ITag[];
  idMapping: any;
}

interface IEdgeConfig {
  name: string;
  file: any;
  props: any[];
  type: string;
}

interface IState {
  currentStep: number;
  activeStep: number;
  taskDir: string;
  uploadDir: string;
  files: any[];
  vertexesConfig: IVertexConfig[];
  edgesConfig: IEdgeConfig[];
  activeVertexIndex: number;
  activeEdgeIndex: number;
  vertexAddCount: number;
  edgeAddCount: number;
  isImporting: boolean;
  taskId: string;
}

export const importData = createModel<IRootModel>()({
  state: {
    activeStep: 0,
    currentStep: 0,
    taskDir: '',
    uploadDir: '',
    files: [] as any[],
    vertexesConfig: [] as IVertexConfig[],
    edgesConfig: [] as IEdgeConfig[],
    activeVertexIndex: -1,
    activeEdgeIndex: -1,
    isImporting: false,
    taskId: 'all',
    vertexAddCount: 1,
    edgeAddCount: 1,
  } as IState,
  reducers: {
    update: (state: IState, payload: object): IState => {
      return {
        ...state,
        ...payload,
      };
    },
    newVertexConfig: (state: IState, payload: Record<string, unknown>): IState => {
      const { file } = payload;
      const { vertexesConfig, vertexAddCount } = state;
      const vertexName = `${intl.get('import.datasource')} ${vertexAddCount}`;
      return {
        ...state,
        vertexesConfig: [
          ...vertexesConfig,
          {
            name: vertexName,
            file,
            tags: [],
            idMapping: null,
          },
        ],
        activeVertexIndex: vertexesConfig.length,
        vertexAddCount: vertexAddCount + 1,
      };
    },
    updateVertexConfig: (state: IState, vertex: IVertexConfig) => {
      const { activeVertexIndex, vertexesConfig } = state;
      vertexesConfig[activeVertexIndex] = vertex;

      return {
        ...state,
        vertexesConfig,
      };
    },
    deleteVertexConfig: (state: IState, payload: Record<string, unknown>) => {
      const { vertexName } = payload;
      const { vertexesConfig, activeVertexIndex } = state;
      let deleteIndex;
      const newVertexesConfig = vertexesConfig.filter((v, i) => {
        if (v.name !== vertexName) {
          return true;
        } else {
          deleteIndex = i;
          return false;
        }
      });
      let newActiveVertexIndex;
      if (activeVertexIndex === deleteIndex) {
        newActiveVertexIndex = newVertexesConfig.length === 0 ? -1 : 0;
      } else {
        newActiveVertexIndex =
          activeVertexIndex > deleteIndex
            ? activeVertexIndex - 1
            : activeVertexIndex;
      }

      return {
        ...state,
        activeVertexIndex: newActiveVertexIndex,
        vertexesConfig: newVertexesConfig,
      };
    },
    updateTagConfig: (
      state: IState,
      payload: {
        tagIndex: number;
        props: any;
        tag: string;
      },
    ) => {
      const { vertexesConfig, activeVertexIndex } = state;
      const vertex = vertexesConfig[activeVertexIndex];
      const { props, tagIndex, tag } = payload;
      const tagConfig = vertex.tags[tagIndex];
      tagConfig.name = tag;
      tagConfig.props = props;

      return {
        ...state,
        vertexesConfig,
      };
    },
    deleteTag: (state: IState, tagIndex: number) => {
      const { vertexesConfig, activeVertexIndex } = state;
      const vertex = vertexesConfig[activeVertexIndex];
      vertex.tags.splice(tagIndex, 1);

      return {
        ...state,
        vertexesConfig: [...vertexesConfig],
      };
    },
    addTag: (state: IState) => {
      const { vertexesConfig, activeVertexIndex } = state;
      const vertex = vertexesConfig[activeVertexIndex];
      vertex.tags.push({
        name: '',
        props: [],
      });

      return {
        ...state,
        vertexesConfig: [...vertexesConfig],
      };
    },
    newEdgeConfig: (state: IState, payload: Record<string, unknown>) => {
      const { file } = payload;
      const { edgesConfig, edgeAddCount } = state;
      const edgeName = `Edge ${edgeAddCount}`;

      return {
        ...state,
        edgesConfig: [
          ...edgesConfig,
          {
            file,
            name: edgeName,
            props: [],
            type: '',
          },
        ],
        activeEdgeIndex: edgesConfig.length,
        edgeAddCount: edgeAddCount + 1,
      };
    },
    deleteEdgeConfig: (state: IState, payload: Record<string, unknown>) => {
      const { edgesConfig, activeEdgeIndex } = state;
      const { edgeName } = payload;
      let deleteIndex;
      const newEdgesConfig = edgesConfig.filter((e, i) => {
        if (e.name !== edgeName) {
          return true;
        } else {
          deleteIndex = i;
          return false;
        }
      });

      let newActiveEdgeIndex;
      if (activeEdgeIndex === deleteIndex) {
        newActiveEdgeIndex = newEdgesConfig.length === 0 ? -1 : 0;
      } else {
        newActiveEdgeIndex =
          activeEdgeIndex > deleteIndex ? activeEdgeIndex - 1 : activeEdgeIndex;
      }

      return {
        ...state,
        edgesConfig: newEdgesConfig,
        activeEdgeIndex: newActiveEdgeIndex,
      };
    },

    updateEdgeConfig: (state: IState, payload: any) => {
      const { edgesConfig, activeEdgeIndex } = state;
      const { props, edgeType } = payload;
      const edge = edgesConfig[activeEdgeIndex];
      edge.props = props;
      edge.type = edgeType;

      return {
        ...state,
        edgesConfig,
      };
    },

    // just make new copy config to render
    refresh: (state: IState) => {
      return {
        ...state,
      };
    },
    nextStep: (state: IState) => {
      const { activeStep, currentStep } = state;
      switch (activeStep) {
        case 0:
          return {
            ...state,
            activeStep: 1,
            currentStep: currentStep > 1 ? currentStep : 1,
          };
        case 1:
          return {
            ...state,
            currentStep: currentStep > 2 ? currentStep : 2,
            activeStep: 2,
          };
        case 2:
          return {
            ...state,
            currentStep: currentStep > 3 ? currentStep : 3,
            activeStep: 3,
          };
        case 3:
          return {
            ...state,
            currentStep: currentStep > 4 ? currentStep : 4,
            activeStep: 4,
          };
        case 4:
          return {
            ...state,
            activeStep: 0,
          };
        default:
          return state;
      }
    },
  },
  effects: {
    async resetAllConfig() {
      this.update({
        activeStep: 0,
        currentStep: 0,
        files: [] as any[],
        vertexesConfig: [] as IVertexConfig[],
        edgesConfig: [] as IEdgeConfig[],
        activeVertexIndex: -1,
        activeEdgeIndex: -1,
        vertexAddCount: 0,
        edgeAddCount: 0,
        isImporting: false,
      });
    },
    async importData(payload: Record<string, unknown>, rootState) {
      const {
        nebula: { spaceVidType },
      } = rootState;
      const config: any = configToJson({ ...payload, spaceVidType });
      const { code, data, message: errorMsg } = (await service.importData({
        configBody: config,
        configPath: '',
      })) as any;
      if (code === 0) {
        this.update({
          taskId: data[0],
          isImporting: true,
        });
      } else {
        message.error(errorMsg);
      }
      return code;
    },

    async checkImportStatus(payload: Record<string, unknown>) {
      const res = await service.handleImportAction(payload);
      return res;
    },

    async stopImport(payload: Record<string, unknown>) {
      this.update({
        isImporting: false,
      });
      service.handleImportAction(payload);
    },

    async changeTagType(payload: {
      activeVertexIndex: number;
      vertexesConfig: IVertexConfig[];
      record: any;
      tagName: string;
      type: string;
    }) {
      const {
        activeVertexIndex,
        vertexesConfig,
        record,
        tagName,
        type,
      } = payload;
      vertexesConfig[activeVertexIndex].tags.forEach(tag => {
        if (tag.name === tagName) {
          tag.props.forEach(prop => {
            if (prop.name === record.name) {
              prop.type = type;
            }
          });
        }
      });
      this.update({
        vertexesConfig,
      });
    },

    async changeEdgeFieldType(payload: {
      edge: IEdgeConfig;
      propName: string;
      type: string;
    }) {
      const { edge, propName, type } = payload;
      edge.props.forEach(prop => {
        if (prop.name === propName) {
          prop.type = type;
        }
      });
      this.update({
        edge,
      });
    },

    async testImport(payload, rootState) {
      const {
        nebula: { spaceVidType },
      } = rootState;
      const config: any = configToJson({ ...payload, spaceVidType });
      const { taskId, errCode } = (await service.importData(config)) as any;
      this.update({
        taskId,
      });
      return errCode;
    },

    async asyncTestDataMapping(
      payload: {
        vertexesConfig: any[];
        edgesConfig: any[];
        activeStep: number;
      },
      rootState,
    ) {
      const { vertexesConfig, edgesConfig, activeStep } = payload;
      const {
        nebula: { spaceVidType },
      } = rootState;
      const configInfo = {
        vertexesConfig: activeStep === 2 ? vertexesConfig : [],
        edgesConfig: activeStep === 3 ? edgesConfig : [],
        spaceVidType,
      };
      try {
        const gql: string = getGQLByConfig(configInfo).join(';');
        const { code, message: msg } = (await service.execNGQL({
          gql,
        })) as any;
        if (code !== 0) {
          message.error(`${msg}`);
        }
        return code;
      } catch (error) {
        console.log(error);
      }
    },

    async asyncUpdateEdgeConfig(payload: { edgeType: string }, rootState) {
      const { edgeType } = payload;
      const {
        nebula: { spaceVidType },
      } = rootState;
      const { code, data } = (await service.execNGQL({
        gql: `DESCRIBE EDGE ${handleKeyword(edgeType)}`,
      })) as any;
      const createTag = (await service.execNGQL({
        // HACK: Process the default value fields
        gql: `show create EDGE ${handleKeyword(edgeType)}`,
      })) as any;
      const defaultValueFields: any[] = [];
      if (!!createTag) {
        const res =
          (createTag.data.tables && createTag.data.tables[0]['Create Edge']) ||
          '';
        // HACK: createTag split to ↵
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

        this.updateEdgeConfig({
          props: [
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
          ],
          edgeType,
        });
      }
    },

    async asyncUpdateTagConfig(payload: { tag: string; tagIndex: number }) {
      const { tag, tagIndex } = payload;
      const { code, data } = (await service.execNGQL({
        // HACK: Processing keyword
        gql: `DESCRIBE TAG ${handleKeyword(tag)}`,
      })) as any;
      const createTag = (await service.execNGQL({
        // HACK: Process the default value fields
        gql: `show create tag ${handleKeyword(tag)}`,
      })) as any;
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
        this.updateTagConfig({
          props,
          tagIndex,
          tag,
        });
      }
    },

    async asyncGetImportWorkingDir() {
      const { code, data } = (await service.getImportWokingDir()) as any;
      if (code === 0) {
        const { taskDir, uploadDir } = data;
        this.update({
          taskDir,
          uploadDir,
        });
      } else {
        message.warning(intl.get('import.mountPathWarning'), 5);
      }
    },
  },
});
