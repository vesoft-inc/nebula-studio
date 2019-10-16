
const nebulaWords = [
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
];

export const HighLightList = [
  ...nebulaWords,
  ...nebulaWords.map((w) => w.toLowerCase()),
];
