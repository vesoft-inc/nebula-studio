import service from '#assets/config/service';
import { getExploreGQLWithIndex } from '#assets/utils/gql';

export async function fetchVertexProps(id: any, useHash?: string) {
  const _id =
    useHash === 'unset' || useHash === undefined
      ? `${id}`
      : `${useHash}(${id})`;
  const gql = `fetch prop on * ${_id}`;
  const { data, code, message } = (await service.execNGQL({
    gql,
  })) as any;
  return { data, code, message };
}

export async function fetchEdgeProps(payload: {
  id: any;
  type: string;
  edgeFields: any;
}) {
  const { id, edgeFields, type } = payload;
  const edgeType = '`' + type + '`';
  let gql = `fetch prop on ${id} yield ${edgeType}._src, ${edgeType}._dst `;
  edgeFields[type].forEach(edgeField => {
    if (edgeField !== 'type') {
      gql += `,${edgeType}.${edgeField}`;
    }
  });
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
