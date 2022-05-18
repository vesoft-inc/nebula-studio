import { convertBigNumberToString, handleVidStringName } from '@app/utils/function';
import { uniq } from 'lodash';
import { DEFAULT_COLOR_PICK_LIST } from '@app/config/explore';

export const whichColor = (() => {
  const colorsTotal = DEFAULT_COLOR_PICK_LIST.length;
  let colorIndex = 0;
  const colorsRecord = {};
  return (key) => {
    if (!colorsRecord[key]) {
      colorsRecord[key] = DEFAULT_COLOR_PICK_LIST[colorIndex];
      colorIndex = (colorIndex + 1) % colorsTotal;
    }
    return colorsRecord[key];
  };
})();

function getGroup(tags = []) {
  return tags.sort().join('-');
}
export function getTagData(nodes, expand?, tagColorMap?) {
  const data = nodes.map((node) => {
    const { vid, tags = [], properties } = node;
    const group = getGroup(tags);
    let color;
    let iconText;
    if (expand?.vertexStyle === 'custom') {
      color = expand.customColor;
      iconText = expand.customIcon;
    } else if (tagColorMap && tagColorMap[group]) {
      color = tagColorMap[group][0].color;
    } else {
      color = whichColor(group);
    }
    return {
      id: convertBigNumberToString(vid),
      tags,
      properties,
      color,
      iconText,
      // nodeSize: Math.random() * 30
    };
  });
  return data;
}

export function getBidrectVertexIds(data) {
  const { tables } = data;
  // go from nqgl return [{*._dst: id}]
  // go from yield edge nqgl return [{_edgesParsedList: srcID: xx, dstID: xx}]
  const vertexIds: string[] = [];
  tables.forEach((item) => {
    item._edgesParsedList.forEach((edge) => {
      const { dstID, srcID } = edge;
      vertexIds.push(String(dstID));
      vertexIds.push(String(srcID));
    });
  });
  return uniq(vertexIds);
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
        if(!relationships && path.srcID) {
          vertexes.push(path.srcID);
        } else if (relationships !== null) {
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
        }
      });
    }
  });
  return { vertexes, edges };
}
