const isRepeat = (vertexs, vertex, length) => {
  for (let i: number = 0; i < length; i++) {
    if (vertexs[i].name === vertex) {
      return true;
    }
  }
  return false;
};

export default function readFileContent(
  vertexs: Array<{ name: any; group: number }>,
  data: { tables: any[] },
  edgetype: string,
) {
  const edges: any = [];

  const len = data.tables.length;
  const length = vertexs.length;
  for (let _i: number = 0; _i < len; _i++) {
    const item: any = data.tables[_i];
    if (!isRepeat(vertexs, item.destid, length)) {
      vertexs.push({
        name: item.destid,
        group: 6,
      });
    }
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
