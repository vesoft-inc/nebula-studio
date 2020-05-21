export const getExploreGQL = (params: {
  selectVertexes: any[];
  edgeTypes: string[];
  edgeDirection: string;
  filters: any[];
}) => {
  const { selectVertexes, edgeTypes, edgeDirection, filters } = params;

  const wheres = filters
    .filter(filter => filter.field && filter.operator && filter.value)
    .map(filter => `${filter.field} ${filter.operator} ${filter.value}`)
    .join(`\n  AND `);
  let direction;
  switch (edgeDirection) {
    case 'incoming':
      direction = 'REVERSELY';
      break;
    default:
      direction = ''; // default outgoing
  }
  const gql = `GO FROM 
  ${selectVertexes.map(d => d.name)}
OVER 
  ${edgeTypes.join(',')} ${direction} ${wheres ? `\nWHERE ${wheres}` : ''}
YIELD 
${edgeTypes
  .map(
    type =>
      `  ${type}._src as ${type}SourceId,\n  ${type}._dst as ${type}DestId,\n  ${type}._rank as ${type}Rank`,
  )
  .join(',\n')};
`;

  return gql;
};
