import tckJSON from "./tck.json";

const map: Record<string, Record<string, string[]>> = {};

const cateogryMap: Record<string, string[]> = {};
const allNGQL = [];
tckJSON.forEach((item) => {
  const { path, file_name } = item;
  const name = file_name.replace(".", "");
  map[path] = map[path] || {};
  // filter 300 length
  map[path][name] = item.statements.filter(
    (statement) => statement.length < 400
  );
  cateogryMap[name] = map[path][name];
  allNGQL.push(...map[path][name]);
});
const category = {};
let categoryString = "";
for (const path in map) {
  category[path] = Object.keys(map[path]);
  categoryString += `${path}[${category[path].join(",")}],`;
}
export default {
  map,
  cateogryMap,
  categoryString,
  allNGQL,
};
