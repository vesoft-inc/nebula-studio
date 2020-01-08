import service from '#assets/config/service';

export async function fetchVertexId(
  { space, host, username, password }: any,
  id: any[],
) {
  const gql = `use ${space}; fetch prop on * ${id}`;
  const { data } = (await service.execNGQL({
    host,
    username,
    password,
    gql,
  })) as any;
  return data;
}
