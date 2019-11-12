import _ from 'lodash';

export default function nebulaToData(
  vertexs: Array<{ name: any; group: number }>,
  data: { tables: any[] },
  edgetype: string,
) {
  const edges: any = [];

  const len = data.tables.length;
  for (let _i: number = 0; _i < len; _i++) {
    const item: any = data.tables[_i];
    vertexs.push({
      name: item.destid,
      group: 6,
    });
    vertexs = _.uniqBy(vertexs, 'name');
    edges.push({
      source: item.sourceid,
      target: item.destid,
      value: 3,
      type: edgetype,
    });
  }
  return {
    vertexs,
    edges,
  };
}
