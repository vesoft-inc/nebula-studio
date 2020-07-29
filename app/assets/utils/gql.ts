export const getExploreGQL = (params: {
  selectVertexes: any[];
  edgeTypes: string[];
  edgeDirection: string;
  filters: any[];
  quantityLimit: number | null;
}) => {
  const {
    selectVertexes,
    edgeTypes,
    edgeDirection,
    filters,
    quantityLimit,
  } = params;
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
  const gql =
    `GO FROM 
  ${selectVertexes.map(d => d.name)}
OVER
  ` +
    '`' +
    edgeTypes.join('`,`') +
    '` ' +
    `${direction} ${wheres ? `\nWHERE ${wheres}` : ''}
YIELD 
${edgeTypes
  .map(type => {
    const typeName = '`' + type + '`';
    return `${typeName}._src as ${type}SourceId,\n  ${typeName}._dst as ${type}DestId,\n  ${typeName}._rank as ${type}Rank`;
  })
  .join(',\n')}
` +
    `${
      quantityLimit
        ? `| LIMIT
  ${quantityLimit};`
        : `;`
    }`;

  return gql;
};
