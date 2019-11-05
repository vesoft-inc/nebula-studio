export default {
  nodes: [
    { name: '200', group: 1 },
    { name: '201', group: 2 },
    { name: '202', group: 4 },
    { name: '203', group: 3 },
    { name: '205', group: 4 },
  ],
  links: [
    { source: 2, target: 1, value: 3 },
    { source: 3, target: 2, value: 2 },
    { source: 3, target: 4, value: 5 },
    { source: 1, target: 0, value: 8 },
    { source: 3, target: 0, value: 8 },
  ],
};

// target is linking the nodal index, not the group or id
