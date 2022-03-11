import { BigNumber } from 'bignumber.js';
import _ from 'lodash';

export const handleKeyword = (name: string) => {
  return `\`${handleEscape(name)}\``;
};

export const handleEscape = (name: string) =>
  name.replaceAll(/\\/gm, '\\\\').replaceAll('`', '\\`');

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

export const sortByFieldAndFilter = (payload: {
  field: string;
  searchVal: string;
  list: any[];
}) => {
  const { searchVal, list, field } = payload;
  if (searchVal) {
    return _.orderBy(list, [field], ['asc']).filter((item: any) =>
      item.name.includes(searchVal),
    );
  } else {
    return _.orderBy(list, [field], ['asc']);
  }
};

export const removeNullCharacters = (data: string) => {
  return data.replace(/\u0000+$/, '');
};