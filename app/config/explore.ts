import { NodeObject } from '@vesoft-inc/force-graph';
import BigNumber from 'bignumber.js';
import JSONBigint from 'json-bigint';
import json2csv from 'json2csv';
import { remove } from 'lodash';
export const LINE_LENGTH = 150;
export const FONT_SIZE = 10;
export const NODE_SIZE = 18;
export const NODE_AREA = NODE_SIZE * NODE_SIZE;

export const COLOR_PICK_LIST = [
  '#B93431',
  '#B95C31',
  '#B98031',
  '#B9B031',
  '#68B931',
  '#31B9B1',
  '#3180B9',
  '#7331B9',
  '#FF7875',
  '#FF9C6E',
  '#FFC069',
  '#FFF566',
  '#95DE64',
  '#5CDBD3',
  '#69C0FF',
  '#B37FEB',
  '#FFB9B8',
  '#FFCEB8',
  '#FFE1B8',
  '#FFFAB8',
  '#D7F2C4',
  '#C5F2EF',
  '#B8E1FF',
  '#DAC1F5',
  '#FFE6E6',
  '#FFEEE6',
  '#FFF4E6',
  '#FFFDE6',
  '#F1FBEA',
  '#EAFAF9',
  '#E6F4FF',
  '#F2E9FC',
];
export const DEFAULT_COLOR_PICK_LIST = [
  '#FF7875',
  '#FF9C6E',
  '#FFC069',
  '#FFF566',
  '#95DE64',
  '#5CDBD3',
  '#69C0FF',
  '#B37FEB',
  '#FFB9B8',
  '#FFCEB8',
  '#FFE1B8',
  '#FFFAB8',
  '#D7F2C4',
  '#C5F2EF',
  '#B8E1FF',
  '#DAC1F5',
  '#FFE6E6',
  '#FFEEE6',
  '#FFF4E6',
  '#FFFDE6',
  '#F1FBEA',
  '#EAFAF9',
  '#E6F4FF',
  '#F2E9FC',
  '#B93431',
  '#B95C31',
  '#B98031',
  '#B9B031',
  '#68B931',
  '#31B9B1',
  '#3180B9',
  '#7331B9',
];

export const flattenData = data => {
  const result = {};
  const fieldData = [] as any;
  function recurse(cur: any, prop) {
    if (Object(cur) !== cur) {
      fieldData.push(prop);
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for (let i = 0, l = cur.length; i < l; i++) {
        recurse(cur[i], prop ? prop + '.' + i : '' + i);
        if (l === 0) {
          result[prop] = [];
        }
      }
    } else if (BigNumber.isBigNumber(cur)) {
      result[prop] = cur;
    } else {
      let isEmpty = true;
      Object.keys(cur).forEach(p => {
        isEmpty = false;
        recurse(cur[p], prop ? prop + '.' + p : p);
        if (isEmpty) {
          result[prop] = {};
        }
      });
    }
  }
  recurse(data, '');
  return { result, fieldData };
};

export const downloadCSVFiles = ({ headers, tables, title }) => {
  try {
    const result = json2csv.parse(tables, {
      fields: headers,
    });
    // Determine browser type
    if (
      (navigator.userAgent.indexOf('compatible') > -1 &&
        navigator.userAgent.indexOf('MSIE') > -1) ||
      navigator.userAgent.indexOf('Edge') > -1
    ) {
      // IE10 or Edge browsers
      const BOM = '\uFEFF';
      const csvData = new Blob([BOM + result], { type: 'text/csv' });
      // @ts-ignore
      navigator.msSaveBlob?.(csvData, `test.csv`);
    } else {
      // Non-Internet Explorer
      // Use the download property of the A tag to implement the download function
      const link = document.createElement('a');
      link.href =
        'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(result);
      link.download = `${title}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    alert(err);
  }
};

export const parseData = (data, type: 'vertex' | 'edge') => {
  const fields =
    type === 'vertex'
      ? ['vid', 'attributes']
      : ['type', 'srcId', 'dstId', 'rank', 'attributes'];
  const tables: any = [];
  data.forEach((item: any) => {
    const _result = {} as any;
    const properties = item.properties;
    const { result } = flattenData(properties) as any;
    if (type === 'vertex') {
      _result.vid = item.id;
      _result.attributes = JSONBigint.stringify(result);
      tables.push(_result);
    } else if (type === 'edge') {
      _result.type = item.edgeType;
      _result.srcId = item.source;
      _result.dstId = item.target;
      _result.rank = item.rank;
      _result.attributes = JSONBigint.stringify(result);
      tables.push(_result);
    }
  });
  return { tables, headers: fields };
};

export const exportDataToCSV = (
  data,
  type: 'vertex' | 'edge',
) => {
  const { headers, tables } = parseData(data, type);
  downloadCSVFiles({ headers, tables, title: type });
};

export const updateTagMap = (tagMap, vertexes) => {
  Object.keys(tagMap).forEach(tag => {
    const colorGroup = tagMap[tag];
    colorGroup.forEach(colorMap => {
      colorMap.countIds = [];
    });
  });
  vertexes.forEach(vertex => {
    const { color, tags = [], id } = vertex;
    const group = tags.sort().join('-');
    const colorMap = tagMap[group];
    if (colorMap) {
      const hasColor = colorMap.some(item => {
        if (item.color === color && !item.countIds.includes(id)) {
          item.countIds.push(String(id));
          return true;
        }
      });
      if (!hasColor) {
        colorMap.push({
          color,
          countIds: [String(id)]
        });
      }
    } else {
      tagMap[group] = [{
        color,
        countIds: [String(id)]
      }];
    }
  });
  // remove color without data, but need to remain one
  Object.keys(tagMap).forEach(tag => {
    const colorGroup = tagMap[tag];
    const noDataList = colorGroup.filter(item => item.countIds.length === 0).map(item => item.color);
    const removeList = colorGroup.length === noDataList.length ? noDataList.slice(1) : noDataList;
    remove(tagMap[tag], (item: any) => removeList.includes(item.color));
  });
  return { ...tagMap };
};

export const updateEdgeMap = (edgeMap, edges) => {
  Object.keys(edgeMap).forEach(item => {
    edgeMap[item] = {
      countIds: []
    };
  });
  edges.forEach(edge => {
    const { edgeType, id } = edge;
    edgeMap[edgeType].countIds = [...edgeMap[edgeType].countIds, id];
  });
  return { ...edgeMap };
};
export const makeRoundPosition = (data: NodeObject[] | Set<NodeObject>, center: { x: number; y: number }) => {
  const nodes = [...data];
  const length = nodes.length;
  const radius = Math.min(Math.max((length * NODE_SIZE) / 2, LINE_LENGTH), window.innerHeight / 2);
  // when nodes.length>50 use sphere layout
  if (nodes.length < 50) {
    nodes.forEach((node, index) => {
      const angle = (index / length) * Math.PI * 2;
      node.x = radius * Math.sin(angle) + center.x;
      node.y = radius * Math.cos(angle) + center.y;
    });
  } else {
    nodes.forEach((node) => {
      const angle = Math.random() * Math.PI * 2;
      const r = radius * Math.random();
      node.x = r * Math.sin(angle) + center.x;
      node.y = r * Math.cos(angle) + center.y;
    });
  }
    
};
export const CANVAS_HIDE_LABEL_SCALE = 1.0;