import service from '@app/config/service';
import { handleKeyword, handleVidStringName } from '@app/utils/function';
import { getExploreGQLWithIndex } from '@app/utils/gql';

interface IMatchVertex {
  vid?: string;
  tags?: string[];
  properties?: Record<string, unknown>;
}

export async function fetchEdgeProps(payload: {
  idRoutes: string[];
  type: string;
  edgeFields?: any;
}) {
  const { idRoutes, edgeFields, type } = payload;
  const edgeType = handleKeyword(type);
  let gql = `fetch prop on ${edgeType} ${idRoutes.join(', ')}`;
  if (edgeFields) {
    gql += ` yield ${edgeType}._src, ${edgeType}._dst `;
    edgeFields[type].forEach(edgeField => {
      if (edgeField !== 'type') {
        gql += `,${edgeType}.${edgeField}`;
      }
    });
  } else {
    gql += ' YIELD edge as `edges_`';
  }

  const { data } = (await service.execNGQL({
    gql,
  })) as any;
  return data;
}

export async function fetchVertexPropsWithIndex(payload: {
  tag: string;
  filters: any[];
  quantityLimit: number | null;
}) {
  const gql = getExploreGQLWithIndex(payload);
  const { code, data, message } = (await service.execNGQL({
    gql,
  })) as any;
  return { code, data, message };
}

export async function fetchVertexProps(payload: {
  ids: string[];
  spaceVidType: string;
}) {
  const { ids, spaceVidType } = payload;
  const _ids = ids.map(id => handleVidStringName(id, spaceVidType)).join(', ');
  const gql = `MATCH (n) WHERE id(n) IN [${_ids}] RETURN n`;
  const { data, code, message } = (await service.execNGQL({
    gql,
  })) as any;
  if (code === 0) {
    const vertexList = data.tables.map(i => i._verticesParsedList).flat();
    const vertexes = vertexList.map(vertex => {
      const _vertex: IMatchVertex = {};
      _vertex.vid = vertex.vid || '';
      _vertex.tags = vertex.tags || [];
      _vertex.properties = vertex.properties || {};
      return _vertex;
    });
    return { data: vertexes, code, message };
  }
  return { data, code, message };
}

export async function fetchBidirectVertexes(payload: {
  ids: string[];
  spaceVidType: string;
}) {
  const { ids, spaceVidType } = payload;
  const _ids = ids.map(id => handleVidStringName(id, spaceVidType)).join(', ');
  const gql = `GO FROM ${_ids} OVER * BIDIRECT yield edge as \`_edge\``;
  const { code, data, message } = (await service.execNGQL({
    gql,
  })) as any;
  return { code, data, message };
}
