import ngqlJson from './ngql.json';

const urlTransformerMap = {
  FETCH: 'FETCHProps',
  MATCH: 'MatchOrCypherOrPatternOrScan',
  GO: 'GOFromVID',
  FIND: 'FindPath',
};
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
//@ts-ignore
window.ngqlMap = ngqlMap;
export const NGQLCategoryString = ngqlDoc
  .filter((item) => item.url.indexOf('ngql-guide') >= 0)
  .map((item) => item.title)
  .join(',');
