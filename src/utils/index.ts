import { Theme } from '@emotion/react';
import { v4 as uuid } from 'uuid';
import JSONBigInt from 'json-bigint';

export const safeParse = <T = unknown>(json: string): [T?, Error?] => {
  try {
    return [JSON.parse(json)];
  } catch (e) {
    return [undefined, e as Error];
  }
};

export const isType = <T>(value: unknown, type: string): value is T => {
  const typeString = Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  return typeString === type.toLowerCase();
};

export const getDuplicateValues = <T>(values: T[], key?: keyof T): T[] => {
  const duplicateValues = values.filter((value, index) => {
    if (key) {
      return values.findIndex((v) => v[key] === value) !== index;
    }
    return values.indexOf(value) !== index;
  });
  return duplicateValues;
};

export const getLabelColor = (index: number, theme: Theme): [string, string] => {
  const colors = [
    theme.palette.vesoft.status1,
    theme.palette.vesoft.status2,
    theme.palette.vesoft.status3,
    theme.palette.vesoft.status4,
    theme.palette.vesoft.status5,
  ];
  const bgColor = [
    theme.palette.vesoft.status1Bg,
    theme.palette.vesoft.status2Bg,
    theme.palette.vesoft.status3Bg,
    theme.palette.vesoft.status4Bg,
    theme.palette.vesoft.status5Bg,
  ];
  return [colors[index % colors.length], bgColor[index % bgColor.length]];
};

// veditor's uuid should be a string without '-'
export const createUuid = (): string => uuid().replaceAll('-', '');

export const getVesoftBorder = ({ theme }: { theme: Theme }) => `${theme.palette.vesoft.textColor6} 1px solid`;

/**
 * ```
 * JSONBig is a JSON parser that can handle bigInt
 * for GQL result, always use JSONBig to parse and stringify data
 * ```
 */
export const JSONBig = JSONBigInt();

export const transformNebulaResult = (data: unknown, raw?: boolean): unknown => {
  const isNebulaType = data && typeof data === 'object' && 'raw' in data && 'value' in data;
  if (isNebulaType) {
    return raw ? data.raw : transformNebulaResult(data.value);
  }

  if (isType<Array<unknown>>(data, 'array')) {
    return data.map((val) => transformNebulaResult(val, raw));
  }

  if (isType<Object>(data, 'object')) {
    // for numbers transformed by JSONBig, we need to check if it's a big number
    if ('_isBigNumber' in data) {
      return data;
    }
    return Object.fromEntries(
      Object.entries(data).map(([key, val]) => {
        return [key, transformNebulaResult(val, raw)];
      })
    );
  }

  return data;
};
