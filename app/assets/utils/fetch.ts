import service from '#assets/config/service';

export async function fetchVertexProps(id: any) {
  const gql = `fetch prop on * ${id}`;
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
