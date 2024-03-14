export const safeParse = <T = unknown>(json: string): [T?, Error?] => {
  try {
    return [JSON.parse(json)];
  } catch (e) {
    return [undefined, e as Error];
  }
};
