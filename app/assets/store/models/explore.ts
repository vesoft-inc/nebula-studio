interface IState {
  nodes: any[];
  edges: any[];
}

export const explore = {
  state: {
    nodes: [
      { name: '200', group: 1 },
      { name: '201', group: 2 },
      { name: '202', group: 4 },
      { name: '203', group: 3 },
      { name: '205', group: 4 },
    ],
    links: [
      { source: '200', target: '201', value: 3, type: 'like' },
      { source: '200', target: '202', value: 5, type: 'like' },
      { source: '202', target: '205', value: 5, type: 'like' },
      { source: '200', target: '205', value: 8, type: 'like' },
      { source: '203', target: '201', value: 8, type: 'like' },
    ],
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
