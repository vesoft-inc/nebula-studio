import service from '#assets/config/service';
import { getExploreGQLWithIndex } from '#assets/utils/gql';

export async function fetchVertexProps(id: any, useHash?: string) {
  const _id =
    useHash === 'unset' || useHash === undefined
      ? `${id}`
      : `${useHash}("${id}")`;
  const gql = `fetch prop on * ${_id}`;
  const { data } = (await service.execNGQL({
    gql,
  })) as any;
  return data;
}

export async function fetchEdgeProps(id: any) {
  const gql = `fetch prop on ${id}`;
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
