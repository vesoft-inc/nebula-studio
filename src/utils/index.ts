import { Theme } from '@emotion/react';

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

export const getDuplicateValues = (values: string[]): string[] => {
  const duplicateValues = values.filter((value, index) => {
    return values.findIndex((v) => v === value) !== index;
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
