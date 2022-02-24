import { handleKeyword, handleVidStringName } from '@app/utils/function';
import { IAlterForm, IProperty, ISchemaType, IndexType } from '@app/interfaces/schema';

export const getExploreMatchGQL = (params: {
  selectVertexes: any[];
  edgeTypes: string[];
  edgeDirection?: string;
  filters?: any[];
  quantityLimit?: number | null;
  spaceVidType: string;
  stepsType?: string;
  step?: string;
  minStep?: string;
  maxStep?: string;
}) => {
  const {
    selectVertexes,
    edgeTypes,
    edgeDirection,
    filters,
    quantityLimit,
    spaceVidType,
    stepsType,
    step,
    minStep,
    maxStep,
  } = params;
  let _step = '';
  if (stepsType === 'single') {
    _step = `*${step || 1}`;
  } else if (stepsType === 'range' && minStep && maxStep) {
    _step = `*${minStep}..${maxStep}`;
  }
  const _filters = filters
    ? filters
      .map(filter => `${filter.relation || ''} l.${filter.expression}`)
      .join(`\n`)
    : '';
  const wheres = _filters ? `AND ALL(l IN e WHERE ${_filters})` : '';
  const gql = `MATCH p=(v)${
    edgeDirection === 'incoming' ? '<-' : '-'
  }[e${edgeTypes.map(edge => `:${handleKeyword(edge)}`).join('|')}${_step}]${
    edgeDirection === 'outgoing' ? '->' : '-'
  }(v2) 
WHERE id(v) IN [${selectVertexes
    .map(i => handleVidStringName(i.name, spaceVidType))
    .join(', ')}] 
    ${wheres} RETURN p LIMIT ${quantityLimit ? quantityLimit : 100}`;
  return gql;
};

export const getExploreGQLWithIndex = (params: {
  tag: string;
  filters: any[];
  quantityLimit: number | null;
}) => {
  const { tag, filters, quantityLimit } = params;
  const tagName = handleKeyword(tag);
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
    ` +
    ` yield vertex as \`vertex_\` | LIMIT ${
      quantityLimit ? quantityLimit : 100
    }`;

  return gql;
};

export const getSpaceCreateGQL = (params: {
  name: string;
  comment?: string | undefined;
  options: {
    partition_num: string | undefined;
    replica_factor: string | undefined;
    vid_type: string;
  };
}) => {
  const { name, options, comment } = params;
  const optionsStr = Object.keys(options)
    .filter(i => options[i] !== undefined && options[i] !== '')
    .map(i => {
      return `${i} = ${options[i]}`;
    })
    .join(', ');
  const gql = `CREATE SPACE ${handleKeyword(name)} ${
    optionsStr ? `(${optionsStr})` : ''
  } ${comment ? `COMMENT = "${comment}"` : ''}`;
  return gql;
};

export const getTagOrEdgeCreateGQL = (params: {
  type: ISchemaType;
  name: string;
  comment?: string;
  properties?: IProperty[];
  ttl_col?: string;
  ttl_duration?: number;
}) => {
  const { type, name, properties, ttl_col, ttl_duration, comment } = params;
  const propertiesStr = properties
    ? properties
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
        const _comment = item.comment ? `COMMENT "${item.comment}"` : '';
        const conbine = [
          handleKeyword(item.name),
          _type,
          _null,
          valueStr,
          _comment,
        ];
        return conbine.join(' ');
      })
      .join(', ')
    : '';
  const ttlStr = ttl_col
    ? `TTL_DURATION = ${ttl_duration ||
        ''}, TTL_COL = "${ttl_col || ''}"`
    : '';
  const gql = `CREATE ${type} ${handleKeyword(name)} ${
    propertiesStr.length > 0 ? `(${propertiesStr})` : '()'
  } ${ttlStr} ${
    comment ? `${ttlStr.length > 0 ? ', ' : ''}COMMENT = "${comment}"` : ''
  }`;
  return gql;
};

export const getAlterGQL = (params: IAlterForm) => {
  let content;
  const { type, name, action, config } = params;
  if (action === 'TTL' && config.ttl) {
    const { ttl } = config;
    content = `TTL_DURATION = ${ttl.duration || 0}, TTL_COL = "${
      ttl.col ? handleEscape(ttl.col) : ''
    }"`;
  } else if (action === 'COMMENT') {
    content = `COMMENT="${config.comment}"`;
  } else if (config.fields) {
    const date = config.fields
      .map(item => {
        const { name, type, value, fixedLength, allowNull, comment } = item;
        const propertyName = handleKeyword(name);
        if (action === 'DROP') {
          return propertyName;
        }
        let str = `${propertyName} ${
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
        if (comment) {
          str += ` COMMENT "${comment}"`;
        }
        return str;
      })
      .join(', ');
    content = `${action} (${date})`;
  }
  const gql = `ALTER ${type} ${handleKeyword(name)} ${content}`;
  return gql;
};

export const getIndexCreateGQL = (params: {
  type: IndexType;
  name: string;
  associate: string;
  comment?: string;
  fields: string[];
}) => {
  const { type, name, associate, fields, comment } = params;
  const combine = associate
    ? `on ${handleKeyword(associate)}(${fields.join(', ')})`
    : '';
  const gql = `CREATE ${type} INDEX ${handleKeyword(name)} ${combine} ${
    comment ? `COMMENT "${comment}"` : ''
  }`;
  return gql;
};

export const getPathGQL = (params: {
  type: string;
  srcId: string[];
  dstId: string[];
  relation?: string[];
  direction?: string;
  stepLimit?: number | null;
  quantityLimit?: number | null;
  spaceVidType: string;
}) => {
  const {
    type,
    srcId,
    dstId,
    relation,
    direction,
    stepLimit,
    quantityLimit,
    spaceVidType,
  } = params;
  const _srcIds = srcId
    .map(item => handleVidStringName(item, spaceVidType))
    .join(', ');
  const _dstIds = dstId
    .map(item => handleVidStringName(item, spaceVidType))
    .join(', ');
  const _relation = relation && relation.length > 0 ? relation.join(', ') : '*';
  const gql =
    `FIND ${type} PATH FROM ${_srcIds} TO ${_dstIds} over ${_relation}` +
    `${direction ? ` ${direction}` : ''}` +
    `${stepLimit ? ' UPTO ' + stepLimit + ' STEPS' : ''}` +
    ' yield path as `paths_`' +
    `${quantityLimit ? ' | LIMIT ' + quantityLimit : ''}`;

  return gql;
};
