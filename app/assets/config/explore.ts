import BigNumber from 'bignumber.js';
import JSONBigint from 'json-bigint';
import json2csv from 'json2csv';

import { INode, IPath } from '#assets/utils/interface';

export const MIN_SCALE = 0.3;
export const MAX_SCALE = 1;

export const HOT_KEYS = intl => [
  {
    operation: `Shift + 'Enter'`,
    desc: intl.get('explore.expand'),
  },
  {
    operation: `Shift + '-'`,
    desc: intl.get('common.zoomOut'),
  },
  {
    operation: `Shift + '+'`,
    desc: intl.get('common.zoomIn'),
  },
  {
    operation: `Shift + 'l'`,
    desc: intl.get('common.show'),
  },
  {
    operation: `Shift + 'z'`,
    desc: intl.get('common.rollback'),
  },
  {
    operation: intl.get('common.selected') + ` + Shift + 'del'`,
    desc: intl.get('common.delete'),
  },
];

export const GRAPH_ALOGORITHM = intl => [
  {
    label: intl.get('explore.allPath'),
    value: 'ALL',
  },
  {
    label: intl.get('explore.shortestPath'),
    value: 'SHORTEST',
  },
  {
    label: intl.get('explore.noLoopPath'),
    value: 'NOLOOP',
  },
];

export const DEFAULT_COLOR_PICKER = '#5CDBD3';
export const DEFAULT_COLOR_MIX =
  'linear-gradient(225deg, #32C5FF 0%, #B620E0 51%, #F7B500 100%)';
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
      navigator.msSaveBlob(csvData, `test.csv`);
    } else {
      // Non-Internet Explorer
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + result;
      // Use the download property of the A tag to implement the download function
      const link = document.createElement('a');
      link.href = encodeURI(csvContent);
      link.download = `${title}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    alert(err);
  }
};

export const parseData = (data: INode[] | IPath[], type: 'vertex' | 'edge') => {
  const fields =
    type === 'vertex'
      ? ['vid', 'attributes']
      : ['type', 'srcId', 'dstId', 'rank', 'attributes'];
  const tables: any = [];
  data.forEach((item: any) => {
    const _result = {} as any;
    const properties =
      type === 'vertex' ? item.nodeProp.properties : item.edgeProp.properties;
    const { result } = flattenData(properties) as any;
    if (type === 'vertex') {
      _result.vid = item.name;
      _result.attributes = JSONBigint.stringify(result);
      tables.push(_result);
    } else if (type === 'edge') {
      _result.type = item.type;
      _result.srcId = item.source.name;
      _result.dstId = item.target.name;
      _result.rank = item.rank;
      _result.attributes = JSONBigint.stringify(result);
      tables.push(_result);
    }
  });
  return { tables, headers: fields };
};

export const exportDataToCSV = (
  data: INode[] | IPath[],
  type: 'vertex' | 'edge',
) => {
  const { headers, tables } = parseData(data, type);
  downloadCSVFiles({ headers, tables, title: type });
};
export const DEFAULT_EXPLORE_RULES = {
  edgeTypes: [],
  edgeDirection: 'outgoing',
  stepsType: 'single',
  step: 1,
  vertexColor: 'groupByTag',
  quantityLimit: 100,
};
