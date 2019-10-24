
const nebulaWordsUppercase = [
  'SHOW',
  'GO',
  'VERTEX',
  'EDGE',
  'VALUES',
  'OVER',
  'FROM',
  'YIELD',
  'SPACES',
  'SPACE',
  'YIELD',
  'CREATE',
];

const nebulaWordsLowercase = nebulaWordsUppercase.map((w) => w.toLowerCase());

export const highLightList = [
  ...nebulaWordsUppercase,
  ...nebulaWordsLowercase,
];

export const hints = [
  ...nebulaWordsUppercase,
  ...nebulaWordsLowercase,
];

export const lineNum = 20;
