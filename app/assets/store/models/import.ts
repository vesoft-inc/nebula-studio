import { createModel } from '@rematch/core';

import service from '#assets/config/service';

interface IState {
  currentStep: number;
  activeStep: number;
  mountPath: string;
  files: any[];
  vertexesConfig: any[];
  activeVertexIndex: number;
  vertexAddCount: number;
}

export const importData = createModel({
  state: {
    activeStep: 0,
    currentStep: 5,
    mountPath: '',
    files: [] as any[],
    vertexesConfig: [] as any[],
    activeVertexIndex: -1,
    vertexAddCount: 0,
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
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
    // just make new copy config to render
    refreshVertexesConfig: (state: IState) => {
      return {
        ...state,
      };
    },
    nextStep: (state: IState, payload?: any) => {
      const { activeStep } = state;
      switch (activeStep) {
        case 0:
          const { mountPath } = payload;
          return {
            ...state,
            activeStep: 1,
            mountPath,
          };
        case 1:
          return {
            ...state,
            activeStep: 2,
          };
        default:
          return state;
      }
    },
  },
  effects: {
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
          prop: attr.Field,
          type: attr.Type,
          mapping: null,
          setId: false,
          idHash: 'unset',
        }));
        this.updateTagConfig({
          tagIndex,
          tag,
          props,
        });
      }
    },
  },
});
