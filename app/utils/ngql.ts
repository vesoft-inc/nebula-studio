import ngqlsheet from './ngqlsheet.json';
import doc from './doc.json';
const urlTransformerMap = {
  FETCH: 'FETCHProps',
  Match: 'MatchOrScanOrQuery',
  Go: 'GOFromVID',
  FIND: 'FindPath',
  VertexStatements: 'InsertOrUpdateOrDeleteVertex',
  EdgeStatements: 'InsertOrUpdateOrDeleteEdge',
  QueryTuningStatements: 'ExecutionPlan',
  'Schema-related functions': 'type&src&dst&rank&edgeFunctions',
};

const extralPaths = ['graph-modeling', 'use-importer', '/2.quick-start/6.cheatsheet-for-ngql', 'service-tuning'];
const filterPaths = ['clauses-and-options/', 'operators/'];
const ngqlDocs = Object.keys(ngqlsheet).map((key) => ({
  title: key,
  url: '/2.quick-start/6.cheatsheet-for-ngql/',
  content: ngqlsheet[key],
}));
export const ngqlDoc = [...ngqlDocs, ...doc]
  .map((item) => {
    item.title = item.title
      .split(' ')
      // camelCase
      .map((word) => {
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
    if (urlTransformerMap[item.title]) {
      item.title = urlTransformerMap[item.title];
    }
    item.content = item.content.replace(/nebula>/g, '');
    return item;
  })
  .filter((item) => {
    return !filterPaths.some((path) => item.url.indexOf(path) !== -1);
  });
export const ngqlMap = ngqlDoc.reduce((acc, item) => {
  acc[item.title.toLowerCase()] = item;
  return acc;
}, {});
// @ts-ignore
window.ngqlMap = ngqlMap;
export const NGQLCategoryString = ngqlDoc
  .filter((item) => extralPaths.some((path) => item.url.indexOf(path) !== -1))
  .map((item) => item.title)
  .join(',');
