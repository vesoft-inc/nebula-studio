import { BigNumber } from 'bignumber.js';
import _ from 'lodash';

export const handleKeyword = (name: string) => {
  return `\`${handleEscape(name)}\``;
};

export const handleEscape = (name: string) => name.replace(/\\/gm, '\\\\').replace(/`/gm, '\\`');

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

export const sortByFieldAndFilter = (payload: { field: string; searchVal: string; list: any[] }) => {
  const { searchVal, list, field } = payload;
  if (searchVal) {
    return _.orderBy(list, [field], ['asc']).filter((item: any) => item.name.includes(searchVal));
  } else {
    return _.orderBy(list, [field], ['asc']);
  }
};

export const removeNullCharacters = (data: string) => {
  return data.replace(/\u0000+$/, '');
};

export const safeParse = <T extends unknown>(
  data: string,
  options?: { paser?: (data: string) => T },
): T | undefined => {
  const { paser } = options || {};
  try {
    return paser ? paser(data) : JSON.parse(data);
  } catch (err) {
    console.error('JSON.parse error', err);
    return undefined;
  }
};

export const getByteLength = (str: string) => {
  const utf8Encode = new TextEncoder();
  return utf8Encode.encode(str).length;
};

export const isValidIP = (ip: string) => {
  const reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
  return reg.test(ip);
}; 
