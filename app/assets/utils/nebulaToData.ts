import _ from 'lodash';

export function nebulaToData(
  vertexs: Array<{ name: any; group: number }>,
  data: any[],
  edgetype: string,
) {
  const edges: any = [];

  const len = data.length;
  for (let _i: number = 0; _i < len; _i++) {
    const item: any = data[_i];
    let isSave = false;
    vertexs.map(vertex => {
      if (vertex.name === item.destid) {
        isSave = true;
      }
    });
    if (!isSave) {
      vertexs.push({
        name: item.destid,
        group: 6,
      });
    }
    edges.push({
      source: item.sourceid,
      target: item.destid,
      value: 6,
      type: edgetype,
    });
  }
  return {
    vertexs,
    edges,
  };
}

export function idToSrting(data: any) {
  data.map((item: { destid: string }) => {
    item.destid = String(item.destid);
  });
  return data;
}
