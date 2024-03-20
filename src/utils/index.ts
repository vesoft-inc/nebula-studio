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
