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
  {
    value: 'fixed_string',
    label: 'fixed_string',
  },
];

export const RELATION_OPERATORS = [
  {
    label: 'NOT',
    value: 'NOT',
  },
  {
    label: 'AND',
    value: 'AND',
  },
  {
    label: 'OR',
    value: 'OR',
  },
  {
    label: 'XOR',
    value: 'XOR',
  },
];

export const nameReg = /^[a-zA-Z][a-zA-Z0-9_]*$/;
export const positiveIntegerReg = /^[1-9]\d*$/g;
