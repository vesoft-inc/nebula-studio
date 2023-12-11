import ngqlJson from './doc.json';

const urlTransformerMap = {
  FETCH: 'FETCHProps',
  MATCH: 'MatchOrCypherOrPatternOrScan',
  GO: 'GOFromVID',
  FIND: 'FindPath',
  'Schema-related functions': 'type_src_dst_rank_edge-functions',
};

const extralPaths = ['graph-modeling', 'ngql-guide', 'use-importer'];
export const ngqlDoc = (ngqlJson as { url: string; content: string; title: string }[])
  .map((item) => {
    if (urlTransformerMap[item.title]) {
      item.title = urlTransformerMap[item.title];
    }
    item.title = item.title.replaceAll(' ', '');
    item.content = item.content.replace(/nebula>/g, '');

    return item;
  })
  .filter((item) => {
    return item.url.indexOf('clauses-and-options/') === -1;
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
