import _ from 'lodash';

const statNodeTypes = {};
let nodeTypeNum = 0;

export function nebulaToData(table: any[], edgeType: string) {
  const nodeOut = `${edgeType}-out`;

  if (!statNodeTypes[nodeOut]) {
    nodeTypeNum++;
    statNodeTypes[nodeOut] = nodeTypeNum;
  }

  const groupNum = statNodeTypes[nodeOut];

  return table.reduce(
    (result, { sourceId, destId, rank }) => {
      result.edges.push({
        source: sourceId,
        target: destId,
        value: 6,
        // Each edge can be uniquely identified by a tuple <src_vid, dst_vid, edge_type, rank>
        id: `${sourceId}-${destId}-${edgeType}-${rank}`,
        type: edgeType,
      });
      result.vertexes.push({
        name: destId,
        group: groupNum,
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
  return data.map((item: { destId: string; sourceId: string }) => {
    item.destId = String(item.destId);
    item.sourceId = String(item.sourceId);

    return item;
  });
}
