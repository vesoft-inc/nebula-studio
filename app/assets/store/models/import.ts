import { createModel } from '@rematch/core';

import service from '#assets/config/service';

interface ITag {
  props: any[];
  name: string;
}

interface IVertexConfig {
  name: string;
  file: any;
  tags: ITag[];
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
  mountPath: string;
  files: any[];
  vertexesConfig: IVertexConfig[];
  edgesConfig: IEdgeConfig[];
  activeVertexIndex: number;
  activeEdgeIndex: number;
  vertexAddCount: number;
  edgeAddCount: number;
  isFinish: boolean;
}

export const importData = createModel({
  state: {
    activeStep: 0,
    currentStep: 0,
    mountPath: '',
    files: [] as any[],
    vertexesConfig: [] as IVertexConfig[],
    edgesConfig: [] as IEdgeConfig[],
    activeVertexIndex: -1,
    activeEdgeIndex: -1,
    vertexAddCount: 0,
    edgeAddCount: 0,
    isFinish: true,
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },
    newVertexConfig: (state: IState, payload: any) => {
      const { file } = payload;
      const { vertexesConfig, vertexAddCount } = state;
      const vertexName = `Vertex ${vertexAddCount}`;
      vertexesConfig.push({
        name: vertexName,
        file,
        tags: [],
      });
      return {
        ...state,
        vertexesConfig,
        activeVertexIndex: vertexesConfig.length - 1,
        vertexAddCount: vertexAddCount + 1,
      };
    },
    deleteVertexConfig: (state: IState, payload: any) => {
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
    newEdgeConfig: (state: IState, payload: any) => {
      const { file } = payload;
      const { edgesConfig, edgeAddCount } = state;
      const edgeName = `Edge ${edgeAddCount}`;
      edgesConfig.push({
        file,
        name: edgeName,
        props: [],
        type: '',
      });

      return {
        ...state,
        edgesConfig,
        activeEdgeIndex: edgesConfig.length - 1,
        edgeAddCount: edgeAddCount + 1,
      };
    },
    deleteEdgeConfig: (state: IState, payload: any) => {
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
    nextStep: (state: IState, payload?: any) => {
      const { activeStep, currentStep } = state;
      switch (activeStep) {
        case 0:
          const { mountPath } = payload;
          return {
            ...state,
            activeStep: 1,
            currentStep: currentStep > 1 ? currentStep : 1,
            mountPath,
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
    async importData(payload: { localPath: string }) {
      this.update({
        isFinish: false,
      });
      const { localPath } = payload;
      service.importData({
        localPath,
      });
    },

    async testImport(payload: { localPath: string }) {
      const { localPath } = payload;
      const { code } = (await service.testImport({
        localPath,
      })) as any;
      return code;
    },

    async asyncUpdateEdgeConfig(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
      edgeType: string;
    }) {
      const { host, username, password, edgeType, space } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: `
          use ${space};
          DESCRIBE EDGE ${edgeType};
        `,
      })) as any;
      if (code === '0') {
        const props = data.tables.map(item => ({
          name: item.Field,
          type: item.Type,
          mapping: null,
        }));

        this.updateEdgeConfig({
          props: [
            // each edge must have the three special prop srcId, dstId, rank，put them ahead
            {
              name: 'srcId',
              type: 'int',
              mapping: null,
              useHash: 'unset',
            },
            {
              name: 'dstId',
              type: 'int',
              mapping: null,
              useHash: 'unset',
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

    async asyncCheckFinish() {
      const result = await service.checkImportFinish();
      if (result.data) {
        this.update({
          isFinish: true,
        });
      }
      return result;
    },

    async asyncUpdateTagConfig(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
      tag: string;
      tagIndex: number;
    }) {
      const { host, username, password, space, tag, tagIndex } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: `
          use ${space};
          DESCRIBE TAG ${tag}
        `,
      })) as any;
      if (code === '0') {
        const props = data.tables.map(attr => ({
          name: attr.Field,
          type: attr.Type,
          mapping: null,
          useHash: 'unset',
        }));
        this.updateTagConfig({
          props: [
            // each vertex must have vertex id, put it ahead
            {
              name: 'vertexId',
              type: 'int',
              mapping: null,
              useHash: 'unset',
            },
            ...props,
          ],
          tagIndex,
          tag,
        });
      }
    },
  },
});
