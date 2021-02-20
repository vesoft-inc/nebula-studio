import _ from 'lodash';

import { convertBigNumberToString } from '#assets/utils/function';

export function nebulaToData(
  table: any[],
  edgeTypes: string[],
  direction: string,
) {
  return table.reduce(
    (result, data) => {
      edgeTypes.forEach(type => {
        // HACK: nebula1.0 return 0 if there is no dstid, it'll be fixed in nbula2.0
        // Relative issue: https://github.com/vesoft-inc/nebula/issues/2080
        if (data[`${type}DestId`] === 0) {
          return;
        }
        switch (direction) {
          case 'incoming':
            result.edges.push({
              source: convertBigNumberToString(data[`${type}DestId`]),
              target: convertBigNumberToString(data[`${type}SourceId`]),
              // Each edge can be uniquely identified by a tuple <src_vid, dst_vid, edge_type, rank>
              id: `${data[`${type}DestId`]}->${data[`${type}SourceId`]}@${
                data[`${type}Rank`]
              }`,
              type,
            });
            break;
          default:
            result.edges.push({
              source: convertBigNumberToString(data[`${type}SourceId`]),
              target: convertBigNumberToString(data[`${type}DestId`]),
              // Each edge can be uniquely identified by a tuple <src_vid, dst_vid, edge_type, rank>
              id: `${data[`${type}SourceId`]}->${data[`${type}DestId`]}@${
                data[`${type}Rank`]
              }`,
              type,
            });
        }

        result.vertexes.push({
          name: data[`${type}DestId`],
        });
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
export function idToString(data: any) {
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

export function setLinkName(link) {
  if (link.source.name) {
    return link.source.name < link.target.name
      ? link.source.name + ':' + link.target.name
      : link.target.name + ':' + link.source.name;
  } else {
    return link.source < link.target
      ? link.source + ':' + link.target
      : link.target + ':' + link.source;
  }
}

export function setLink(edges) {
  const linkGroup = {};
  // statistical linkMap linkGroup
  edges.forEach((link: any) => {
    if (typeof link.source === 'string') {
      link.edge = { ...link };
    }
    const key = setLinkName(link);
    if (!linkGroup.hasOwnProperty(key)) {
      linkGroup[key] = [];
    }
    linkGroup[key].push(link);
  });
  // assign linknum to each link
  edges.forEach((link: any) => {
    const key = setLinkName(link);
    link.size = linkGroup[key].length;
    const group = linkGroup[key];
    const keyPair = key.split(':');
    let type = 'noself';
    if (keyPair[0] === keyPair[1]) {
      type = 'self';
    }
    if (group[group.length - 1] === link) {
      setLinkNumbers(group, type);
    }
  });
}
