interface IState {
  nodes: any[];
}

export const explore = {
  state: {
    nodes: [],
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
