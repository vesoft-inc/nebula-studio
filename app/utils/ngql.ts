import ngqlJson from './doc.json';

const urlTransformerMap = {
  FETCH: 'FETCHProps',
  MATCH: 'MatchOrCypherOrPatternOrScan',
  GO: 'GOFromVID',
  FIND: 'FindPath',
  'Schema-related functions': 'type&src&dst&rank&edgeFunctions',
};

const extralPaths = ['graph-modeling', 'ngql-guide', 'use-importer'];
const filterPaths = ['clauses-and-options/', 'operators/'];
export const ngqlDoc = (ngqlJson as { url: string; content: string; title: string }[])
  .map((item) => {
    if (urlTransformerMap[item.title]) {
      item.title = urlTransformerMap[item.title];
    }
    item.title = item.title
      .split(' ')
      // camelCase
      .map((word) => {
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
    item.content = item.content.replace(/nebula>/g, '');
    return item;
  })
  .filter((item) => {
    return !filterPaths.some((path) => item.url.indexOf(path) !== -1);
  });
export const ngqlMap = ngqlDoc.reduce((acc, item) => {
  acc[item.title.toLowerCase()] = item;
  return acc;
});
// @ts-ignore
window.ngqlMap = ngqlMap;
export const NGQLCategoryString = ngqlDoc
  .filter((item) => extralPaths.some((path) => item.url.indexOf(path) !== -1))
  .map((item) => item.title)
  .join(',');
