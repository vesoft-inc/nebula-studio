import { handleKeyword, handleVidStringName } from '#assets/utils/function';
interface IField {
  name: string;
  type: string;
  value?: string;
  allowNull?: boolean;
  fixedLength?: string;
}

type IndexType = 'TAG' | 'EDGE';
type AlterType = 'ADD' | 'DROP' | 'CHANGE' | 'TTL';
interface IAlterConfig {
  fields?: IField[];
  ttl?: {
    col?: string;
    duration?: string;
  };
}

export const getExploreGQL = (params: {
  selectVertexes: any[];
  edgeTypes: string[];
  edgeDirection?: string;
  filters?: any[];
  quantityLimit?: number | null;
}) => {
  const {
    selectVertexes,
    edgeTypes,
    edgeDirection,
    filters,
    quantityLimit,
  } = params;
  const wheres = filters
    ? filters
        .filter(filter => filter.field && filter.operator && filter.value)
        .map(filter => `${filter.field} ${filter.operator} ${filter.value}`)
        .join(`\n  AND `)
    : '';
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
  ${selectVertexes.map(i => handleVidStringName(i.name))}
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
    `| LIMIT ${quantityLimit ? quantityLimit : 100}`;

  return gql;
};

export const getExploreGQLWithIndex = (params: {
  tag: string;
  filters: any[];
  quantityLimit: number | null;
}) => {
  const { tag, filters, quantityLimit } = params;
  const tagName = '`' + tag + '`';
  const wheres = filters
    .filter(
      filter =>
        filter.field &&
        filter.operator &&
        !['', undefined, null].includes(filter.value),
    )
    .map(filter => {
      const value =
        filter.type === 'string' || filter.type.startsWith('fixed_string')
          ? handleVidStringName(filter.value)
          : filter.value;
      return `${filter.relation ? filter.relation : ''} ${tagName}.${
        filter.field
      } ${filter.operator} ${value}`;
    })
    .join(`\n`);
  const gql =
    `LOOKUP ON
  ${handleKeyword(tag)} ${wheres ? `\nWHERE ${wheres}` : ''}
    ` + `| LIMIT ${quantityLimit ? quantityLimit : 100}`;

  return gql;
};

export const getSpaceCreateGQL = (params: {
  name: string;
  options: {
    partition_num: string | undefined;
    replica_factor: string | undefined;
    charset: string | undefined;
    collate: string | undefined;
    vid_type: string | undefined;
  };
}) => {
  const { name, options } = params;
  const optionsStr = Object.keys(options)
    .filter(i => options[i] !== undefined && options[i] !== '')
    .map(i => {
      return `${i} = ${options[i]}`;
    })
    .join(', ');
  const gql = `CREATE SPACE ${handleKeyword(name)} ${
    optionsStr ? `(${optionsStr})` : ''
  }`;
  return gql;
};

export const getTagOrEdgeCreateGQL = (params: {
  type: 'TAG' | 'EDGE';
  name: string;
  fields?: IField[];
  ttlConfig?: {
    ttl_col: string;
    ttl_duration: number;
  };
}) => {
  const { type, name, fields, ttlConfig } = params;
  const fieldsStr = fields
    ? fields
        .map(item => {
          let valueStr = '';
          if (item.value) {
            switch (item.type) {
              case 'string':
              case 'fixed_string':
                valueStr = `DEFAULT "${item.value}"`;
                break;
              case 'timestamp':
                const timestampReg = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/;
                valueStr = timestampReg.test(item.value)
                  ? `DEFAULT "${item.value}"`
                  : `DEFAULT ${item.value}`;
                break;
              default:
                valueStr = `DEFAULT ${item.value}`;
            }
          }
          const _type =
            item.type !== 'fixed_string'
              ? item.type
              : item.type + `(${item.fixedLength ? item.fixedLength : ''})`;
          const _null = item.allowNull ? 'NULL' : 'NOT NULL';
          const conbine = [handleKeyword(item.name), _type, _null, valueStr];
          return conbine.join(' ');
        })
        .join(', ')
    : '';
  const ttlStr = ttlConfig
    ? `TTL_DURATION = ${ttlConfig.ttl_duration ||
        ''}, TTL_COL = "${ttlConfig.ttl_col || ''}"`
    : '';
  const gql = `CREATE ${type} ${handleKeyword(name)} ${
    fieldsStr.length > 0 ? `(${fieldsStr})` : '()'
  } ${ttlStr}`;
  return gql;
};

export const getAlterGQL = (params: {
  type: IndexType;
  name: string;
  action: AlterType;
  config: IAlterConfig;
}) => {
  let content;
  const { type, name, action, config } = params;
  if (action === 'TTL' && config.ttl) {
    const { ttl } = config;
    content = `TTL_DURATION = ${ttl.duration || 0}, TTL_COL = "${ttl.col}"`;
  } else if (action !== 'TTL' && config.fields) {
    const date = config.fields
      .map(item => {
        const { name, type, value, fixedLength, allowNull } = item;
        if (action === 'DROP') {
          return name;
        } else {
          let str = `${name} ${
            type !== 'fixed_string'
              ? type
              : type + `(${fixedLength ? item.fixedLength : ''})`
          } ${allowNull ? 'NULL' : 'NOT NULL'}`;
          if (value) {
            switch (type) {
              case 'string':
              case 'fixed_string':
                str += ` DEFAULT "${value}"`;
                break;
              case 'timestamp':
                const timestampReg = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/;
                str += timestampReg.test(value)
                  ? ` DEFAULT "${value}"`
                  : ` DEFAULT ${value}`;
                break;
              default:
                str += ` DEFAULT ${value}`;
            }
          }
          return str;
        }
      })
      .join(', ');
    content = `${action} (${date})`;
  }
  const gql = `ALTER ${type} ${name} ${content}`;
  return gql;
};

export const getIndexCreateGQL = (params: {
  type: IndexType;
  name: string;
  associate: string;
  fields: string[];
}) => {
  const { type, name, associate, fields } = params;
  const combine = associate
    ? `on ${handleKeyword(associate)}(${fields.join(', ')})`
    : '';
  const gql = `CREATE ${type} INDEX ${handleKeyword(name)} ${combine}`;
  return gql;
};
