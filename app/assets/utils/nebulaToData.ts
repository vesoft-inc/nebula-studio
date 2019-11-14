import _ from 'lodash';

export function nebulaToData(table: any[], edgeType: string) {
  return table.reduce(
    (result, { sourceid, destid }) => {
      result.edges.push({
        source: sourceid,
        target: destid,
        value: 6,
        type: edgeType,
      });
      result.vertexes.push({
        name: destid,
        group: 6,
      });

      return result;
    },
    {
      edges: [],
      vertexes: [],
    },
  );
}

// translate nebula data id type from int to string
export function idToSrting(data: any) {
  return data.map((item: { destid: string; sourceid: string }) => {
    item.destid = String(item.destid);
    item.sourceid = String(item.sourceid);

    return item;
  });
}
