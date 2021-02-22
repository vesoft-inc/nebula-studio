import { BigNumber } from 'bignumber.js';

import { keyWords } from '#assets/config/nebulaQL';
export const handleKeyword = (name: string) => {
  return keyWords.includes(name) ? '`' + name + '`' : name;
};

export const handleVidStringName = (name: string, spaceVidType?: string) => {
  if (spaceVidType && spaceVidType === 'INT64') {
    return convertBigNumberToString(name);
  }
  if (name.indexOf(`"`) > -1 && name.indexOf(`'`) === -1) {
    return `'${name}'`;
  } else {
    return `"${name}"`;
  }
};

export const convertBigNumberToString = (value: any) => {
  // int precision length in nebula is longer than in javascript
  return BigNumber.isBigNumber(value) ? value.toString() : value;
};
