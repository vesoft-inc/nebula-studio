import { BigNumber } from 'bignumber.js';

import { keyWords } from '#assets/config/nebulaQL';
export const handleKeyword = (name: string) => {
  return keyWords.includes(name) ? '`' + name + '`' : name;
};

export const convertBigNumberToString = (value: any) => {
  // int precision length in nebula is longer than in javascript
  return BigNumber.isBigNumber(value) ? value.toString() : value;
};
