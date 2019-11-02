interface IState {
  name: string;
}

export const explore = {
  state: {
    name: 'explore',
  },
  reducers: {
    updateName: (state: IState, payload: string): IState => {
      return {
        name: state.name + payload,
      };
    },
  },
};
