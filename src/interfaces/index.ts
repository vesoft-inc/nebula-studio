import { LINE_STYLE } from '@/components/Shapes/config';
import { createUuid } from '@/utils';
import { EdgeDirectionType, MultiEdgeKeyMode, PropertyDataType, VisualEditorType } from '@/utils/constant';
// import { SystemStyleObject } from '@mui/system';
// import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
// import { InstanceNodePoint } from '@vesoft-inc/veditor/types/Shape/Node';

export const idSymbol = Symbol('id');
export const styleSymbol = Symbol('style');

export class IProperty {
  name: string;
  type: PropertyDataType;
  isPrimaryKey?: boolean = false;
  multiEdgeKey?: boolean = false;
  [idSymbol]: string;

  constructor(params?: Omit<IProperty, typeof idSymbol | 'id'>) {
    this.name = params?.name || '';
    this.type = params?.type || PropertyDataType.STRING;
    this.isPrimaryKey = params?.isPrimaryKey;
    this.multiEdgeKey = params?.multiEdgeKey;
    this[idSymbol] = createUuid();
  }

  get id() {
    return this[idSymbol];
  }
}

export class INodeTypeItem {
  private [idSymbol]: string;
  name: string;
  properties: IProperty[] = [];
  labels: string[] = [];
  style?: VisualInfo;

  constructor(params?: Partial<Pick<INodeTypeItem, 'name' | 'properties' | 'labels' | 'style'>>) {
    this[idSymbol] = createUuid();
    this.name = params?.name ?? '';
    this.properties = params?.properties ?? [];
    this.labels = params?.labels ?? [];
    this.style = params?.style ?? {};
  }

  get id() {
    return this[idSymbol];
  }

  updateValues(values: Omit<INodeTypeItem, typeof idSymbol | 'id'>) {
    const { name, properties, labels } = values || {};
    this.name = name || '';
    this.properties = properties || [];
    this.labels = labels || [];
  }

  setName = (name: string) => {
    this.name = name;
  };
}

export class IEdgeTypeItem {
  private [idSymbol]: string;
  name: string;
  properties: IProperty[] = [];
  labels: string[] = [];
  srcNode: INodeTypeItem;
  dstNode: INodeTypeItem;
  direction: EdgeDirectionType;
  multiEdgeKeyMode: MultiEdgeKeyMode;
  style?: VisualInfo;

  constructor(
    params?: Partial<
      Pick<
        IEdgeTypeItem,
        'name' | 'properties' | 'labels' | 'srcNode' | 'dstNode' | 'direction' | 'style' | 'multiEdgeKeyMode'
      >
    >
  ) {
    this[idSymbol] = createUuid();
    this.name = params?.name ?? '';
    this.srcNode = params?.srcNode || new INodeTypeItem();
    this.dstNode = params?.dstNode || new INodeTypeItem();
    this.properties = params?.properties || [];
    this.labels = params?.labels || [];
    this.direction = params?.direction || EdgeDirectionType.Forward;
    this.multiEdgeKeyMode = params?.multiEdgeKeyMode || MultiEdgeKeyMode.None;
    this.style = params?.style || {
      strokeColor: LINE_STYLE.stroke,
    };
  }

  get id() {
    return this[idSymbol];
  }

  setName = (name: string) => {
    this.name = name;
  };

  updateValues(values: Omit<IEdgeTypeItem, typeof idSymbol | 'id'>) {
    const { name, properties, labels, srcNode, dstNode, direction, style, multiEdgeKeyMode } = values;
    this.name = name;
    this.properties = properties;
    this.labels = labels;
    this.srcNode = srcNode;
    this.dstNode = dstNode;
    this.direction = direction;
    this.multiEdgeKeyMode = multiEdgeKeyMode;
    this.style = style;
  }
}

export interface VisualInfo {
  fill?: string;
  strokeColor?: string;
  shadow?: string;
  x?: number;
  y?: number;
}

export interface VisualNodeCustomizeInfo {
  fill?: string;
  strokeColor?: string;
  shadow?: string;
  type?: VisualEditorType.Tag;
  name?: string;
  comment?: string;
  invalid?: false;
}

export interface Graph {
  /** Graph Name */
  name: string;
  /** Graph Type Name */
  typeName: string;
}

/**
 * @date 2024-03-13
 * @description
 * ```json
 * {
 *   "graph_type_name": "ldbc_type",
 *   "labels": ["City","Place"],
 *   "properties": [
 *     "id: INT64",
 *     "name: STRING",
 *     "url: STRING"
 *   ],
 *   "type": "Node",
 *   "type_name": "City"
 * },
 * ```
 */
export interface GraphTypeElement {
  graph_type_name: string;
  type: 'Node' | 'Edge';
  type_name: string;
  labels: string[];
  /** currently `string[]` is used for `properties` field, but it should be `Property[]` */
  properties: string[];
}

export interface ILabelItem {
  name: string;
  type: 'Node' | 'Edge';
}
