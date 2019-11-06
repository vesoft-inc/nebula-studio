interface IState {
  nodes: any[];
  edges: any[];
}

export const explore = {
  state: {
    nodes: [],
    edges: [],
  },
  reducers: {
    update: (state: IState, payload: object): IState => {
      return {
        ...state,
        ...payload,
      };
    },
  },
};
