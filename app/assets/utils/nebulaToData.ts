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

export function setLinkNumbers(group, type) {
  const len = group.length;
  if (len === 0) {
    return;
  }
  const linksA: any = [];
  const linksB: any = [];
  for (let i = 0; i < len; i++) {
    const link = group[i];
    if (link.source.name) {
      if (link.source.name < link.target.name) {
        linksA.push(link);
      } else {
        linksB.push(link);
      }
    } else {
      if (link.source < link.target) {
        linksA.push(link);
      } else {
        linksB.push(link);
      }
    }
  }
  let maxLinkNumber = 0;
  if (type === 'self') {
    maxLinkNumber = len;
  } else {
    maxLinkNumber = len % 2 === 0 ? len / 2 : (len + 1) / 2;
  }
  const linksALen = linksA.length;
  const linksBLen = linksB.length;

  if (linksALen === linksBLen) {
    let startLinkNumber = 1;
    for (let i = 0; i < linksALen; i++) {
      linksA[i].linknum = startLinkNumber++;
    }
    startLinkNumber = 1;
    for (let i = 0; i < linksBLen; i++) {
      linksB[i].linknum = startLinkNumber++;
    }
  } else {
    let biggerLinks: any[] = [];
    let smallerLinks: any[] = [];
    if (linksA.length > linksB.length) {
      biggerLinks = linksA;
      smallerLinks = linksB;
    } else {
      biggerLinks = linksB;
      smallerLinks = linksA;
    }
    let startLinkNumber = maxLinkNumber;
    const smallerLinksLen = smallerLinks.length;
    for (let i = 0; i < smallerLinksLen; i++) {
      smallerLinks[i].linknum = startLinkNumber--;
    }
    const tmpNumber = startLinkNumber;
    startLinkNumber = 1;
    let p = 0;
    while (startLinkNumber <= maxLinkNumber) {
      biggerLinks[p++].linknum = startLinkNumber++;
    }
    startLinkNumber = 0 - tmpNumber;
    for (let i = p; i < biggerLinks.length; i++) {
      biggerLinks[i].linknum = startLinkNumber++;
    }
  }
}
