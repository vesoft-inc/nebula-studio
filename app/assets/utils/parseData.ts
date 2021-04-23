import _ from 'lodash';

import { handleVidStringName } from '#assets/utils/function';

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

export function parsePathToGraph(data, spaceVidType) {
  const vertexes: any = [];
  const edges: any = [];
  const relationships = data
    .map(i => i._pathsParsedList)
    .flat()
    .map(i => i.relationships)
    .flat();
  relationships.forEach(relationship => {
    const {
      srcID: srcId,
      dstID: dstId,
      edgeName: edgeType,
      rank,
    } = relationship;
    vertexes.push(srcId);
    vertexes.push(dstId);
    edges.push({
      srcId,
      dstId,
      edgeType,
      rank,
      id: `${edgeType} ${handleVidStringName(
        srcId,
        spaceVidType,
      )}->${handleVidStringName(dstId, spaceVidType)}@${rank}}`,
    });
  });
  return { vertexes, edges };
}

export function parseSubGraph(data, spaceVidType) {
  const vertexes: any = [];
  const edges: any = [];
  data.forEach(row => {
    const { _verticesParsedList, _edgesParsedList, _pathsParsedList } = row;
    if (_verticesParsedList) {
      _verticesParsedList.forEach(vertex => {
        vertexes.push(vertex.vid);
      });
    }
    if (_edgesParsedList) {
      _edgesParsedList.forEach(edge => {
        const { dstID: dstId, srcID: srcId, rank, edgeName: edgeType } = edge;
        edges.push({
          srcId,
          dstId,
          edgeType,
          rank,
          id: `${edgeType} ${handleVidStringName(
            srcId,
            spaceVidType,
          )}->${handleVidStringName(dstId, spaceVidType)}@${rank}}`,
        });
        vertexes.push(srcId);
        vertexes.push(dstId);
      });
    }
    if (_pathsParsedList) {
      _pathsParsedList.forEach(path => {
        const relationships = path.relationships;
        relationships.forEach(relationship => {
          const {
            srcID: srcId,
            dstID: dstId,
            edgeName: edgeType,
            rank,
          } = relationship;
          vertexes.push(srcId);
          vertexes.push(dstId);
          edges.push({
            srcId,
            dstId,
            edgeType,
            rank,
            id: `${edgeType} ${handleVidStringName(
              srcId,
              spaceVidType,
            )}->${handleVidStringName(dstId, spaceVidType)}@${rank}}`,
          });
        });
      });
    }
  });
  return { vertexes, edges };
}
