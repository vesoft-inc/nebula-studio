export const enumOfCompare = {
  int64: [
    {
      label: '==',
      value: '==',
    },
    {
      label: '!=',
      value: '!=',
    },
    {
      label: '>',
      value: '>',
    },
    {
      label: '>=',
      value: '>=',
    },
    {
      label: '<',
      value: '<',
    },
    {
      label: '<=',
      value: '<=',
    },
  ],
  string: [
    {
      label: '==',
      value: '==',
    },
  ],
  bool: [
    {
      label: '==',
      value: '==',
    },
  ],
  double: [
    {
      label: '==',
      value: '==',
    },
    {
      label: '!=',
      value: '!=',
    },
    {
      label: '>',
      value: '>',
    },
    {
      label: '>=',
      value: '>=',
    },
    {
      label: '<',
      value: '<',
    },
    {
      label: '<=',
      value: '<=',
    },
  ],
  timestamp: [
    {
      label: '==',
      value: '==',
    },
    {
      label: '!=',
      value: '!=',
    },
    {
      label: '>',
      value: '>',
    },
    {
      label: '>=',
      value: '>=',
    },
    {
      label: '<',
      value: '<',
    },
    {
      label: '<=',
      value: '<=',
    },
  ],
};

export const dataType = [
  {
    value: 'double',
    label: 'double',
  },
  {
    value: 'int',
    label: 'int',
  },
  {
    value: 'bool',
    label: 'bool',
  },
  {
    value: 'string',
    label: 'string',
  },
  {
    value: 'timestamp',
    label: 'timestamp',
  },
];

export const nameReg = /^[a-zA-Z][a-zA-Z0-9_]*$/;
