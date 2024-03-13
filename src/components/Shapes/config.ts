import { VisualEditorLine } from '@/interfaces';

export const NODE_RADIUS = 40;

export const COLOR_LIST = [
  {
    fill: '#E6E6E6',
    strokeColor: 'rgba(60, 60, 60, 0.5)',
    shadow: 'rgba(90, 90, 90, 0.25)',
  },
  {
    fill: '#E4F1FF',
    strokeColor: 'rgba(34, 135, 227, 0.5)',
    shadow: 'rgba(0, 178, 255, 0.25)',
  },
  {
    fill: '#EBE4FF',
    strokeColor: 'rgba(84, 34, 227, 0.5)',
    shadow: 'rgba(20, 0, 255, 0.25)',
  },
  {
    fill: '#FEE4FF',
    strokeColor: 'rgba(227, 34, 196, 0.5)',
    shadow: 'rgba(255, 0, 229, 0.25)',
  },
  {
    fill: '#FFE4E4',
    strokeColor: 'rgba(227, 34, 34, 0.5)',
    shadow: 'rgba(255, 15, 0, 0.25)',
  },
  {
    fill: '#FFF9E4',
    strokeColor: 'rgba(218, 196, 0, 0.5)',
    shadow: 'rgba(209, 163, 0, 0.25)',
  },
  {
    fill: '#EFFFE4',
    strokeColor: 'rgba(54, 200, 2, 0.5)',
    shadow: 'rgba(0, 255, 10, 0.25)',
  },
  {
    fill: '#E4FFF4',
    strokeColor: 'rgba(0, 184, 162, 0.5)',
    shadow: 'rgba(0, 255, 194, 0.25)',
  },
];

export const LINE_STYLE = {
  'stroke-width': 1.6,
  stroke: 'rgba(99, 111, 129, 0.8)',
};

export const ARROW_STYLE = {
  'stroke-width': 1.6,
  stroke: 'rgba(99, 111, 129, 0.8)',
  fill: 'transparent',
  d: 'M7 7L0 0L7 -7',
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
};

export function makeLineSort(links: VisualEditorLine[] = []) {
  // update link sort
  const sourceMap: Record<string, VisualEditorLine[]> = {};
  links.forEach((link) => {
    const sourceId = link.from;
    const targetId = link.to;
    const sourceCommonId = `${sourceId}=>${targetId}`;
    const targetCommonId = `${targetId}=>${sourceId}`;
    const linkArr = sourceMap[sourceCommonId] || sourceMap[targetCommonId];
    if (!linkArr) {
      sourceMap[sourceCommonId] = [link];
    } else if (sourceMap[sourceCommonId]) {
      linkArr.unshift(link);
    } else if (sourceMap[targetCommonId]) {
      linkArr.push(link);
    }
  });
  Object.keys(sourceMap).forEach((key) => {
    if (sourceMap[key].length > 1) {
      const source = sourceMap[key][0].from;
      let status = true;
      let number = sourceMap[key].length % 2 === 0 ? 1 : 0;
      while (sourceMap[key].length) {
        const link = status ? sourceMap[key].pop() : sourceMap[key].shift();
        if (link) {
          link.graphIndex = number;
          // check direction
          if (link.from !== source) {
            link.graphIndex *= -1;
          }
        }
        number++;
        status = !status;
      }
    } else {
      const link = sourceMap[key][0];
      if (link.from === link.to) {
        link.graphIndex = 1;
      } else {
        link.graphIndex = 0;
      }
    }
  });
}

export function getLinkCurvature(link: VisualEditorLine) {
  let curvature = 0;
  const data = link.data;
  if (data.from === data.to) {
    curvature = link.graphIndex;
  } else {
    const { graphIndex } = data;
    if (graphIndex && graphIndex !== 0) {
      const direction = graphIndex % 2 === 0;
      curvature = (direction ? 1 : -1) * (graphIndex > 0 ? 1 : -1) * (Math.ceil(Math.abs(graphIndex) / 2) * 0.1);
    }
  }
  link.curvature = curvature;
  return curvature;
}
