import service from '#assets/config/service';
import { getExploreGQLWithIndex } from '#assets/utils/gql';

export async function fetchVertexProps(payload: {
  ids: string[];
  useHash?: string;
  tag?: string;
}) {
  const { ids, useHash, tag } = payload;
  const _ids =
    useHash === 'unset' || useHash === undefined
      ? `${ids.join(', ')}`
      : ids.map(i => `${useHash}(${i})`).join(', ');
  const _tag = tag ? tag : '*';
  const gql = `fetch prop on ${_tag} ${_ids}`;
  const { data, code, message } = (await service.execNGQL({
    gql,
  })) as any;
  return { data, code, message };
}

export async function fetchEdgeProps(payload: {
  idRoutes: string[];
  type: string;
  edgeFields?: any;
}) {
  const { idRoutes, edgeFields, type } = payload;
  const edgeType = '`' + type + '`';
  let gql = `fetch prop on ${edgeType} ${idRoutes.join(', ')}`;
  if (edgeFields) {
    gql += ` yield ${edgeType}._src, ${edgeType}._dst `;
    edgeFields[type].forEach(edgeField => {
      if (edgeField !== 'type') {
        gql += `,${edgeType}.${edgeField}`;
      }
    });
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

export async function fetchBidirectVertexes(payload: { ids: string[] }) {
  const { ids } = payload;
  const gql = `GO FROM ${ids.join(', ')} OVER * BIDIRECT`;
  const { code, data, message } = (await service.execNGQL({
    gql,
  })) as any;
  return { code, data, message };
}
