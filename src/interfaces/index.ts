import { createUuid } from '@/utils';
import { PropertyDataType, VisualEditorType } from '@/utils/constant';
// import { SystemStyleObject } from '@mui/system';
// import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
// import { InstanceNodePoint } from '@vesoft-inc/veditor/types/Shape/Node';

export const idSymbol = Symbol('id');
const styleSymbol = Symbol('style');

export class IProperty {
  name: string;
  type: PropertyDataType;
  isPrimaryKey?: boolean = false;
  [idSymbol]: string;

  constructor(params?: Omit<IProperty, typeof idSymbol | 'id'>) {
    this.name = params?.name || '';
    this.type = params?.type || PropertyDataType.STRING;
    this.isPrimaryKey = params?.isPrimaryKey;
    this[idSymbol] = createUuid();
  }

  get id() {
    return this[idSymbol];
  }
}

export class INodeTypeItem {
  private [idSymbol]: string;
  private [styleSymbol]?: VisualInfo;
  name: string;
  properties: IProperty[] = [];
  labels: string[] = [];

  constructor(params?: Partial<Pick<INodeTypeItem, 'name' | 'properties' | 'labels'>>) {
    this[idSymbol] = createUuid();
    this.name = params?.name || '';
    this.properties = params?.properties || [];
    this.labels = params?.labels || [];
  }

  get id() {
    return this[idSymbol];
  }

  set style(info: VisualInfo) {
    this[styleSymbol] = info;
  }

  get style(): VisualInfo | undefined {
    return this[styleSymbol];
  }

  updateValues(values: Omit<INodeTypeItem, typeof idSymbol | 'id'>) {
    const { name, properties, labels } = values || {};
    this.name = name || '';
    this.properties = properties || [];
    this.labels = labels || [];
  }
}

export class IEdgeTypeItem {
  private [idSymbol]: string;
  private [styleSymbol]?: VisualInfo;
  name: string;
  properties: IProperty[] = [];
  labels: string[] = [];
  srcNode: INodeTypeItem;
  dstNode: INodeTypeItem;
  constructor(params?: Partial<Pick<IEdgeTypeItem, 'name' | 'properties' | 'labels' | 'srcNode' | 'dstNode'>>) {
    this[idSymbol] = createUuid();
    this.name = params?.name || '';
    this.srcNode = params?.srcNode || new INodeTypeItem();
    this.dstNode = params?.dstNode || new INodeTypeItem();
    this.properties = params?.properties || [];
    this.labels = params?.labels || [];
  }

  get id() {
    return this[idSymbol];
  }

  updateValues(values: Omit<IEdgeTypeItem, typeof idSymbol | 'id'>) {
    const { name, properties, labels, srcNode, dstNode } = values;
    this.name = name;
    this.properties = properties;
    this.labels = labels;
    this.srcNode = srcNode;
    this.dstNode = dstNode;
  }

  set style(info: VisualInfo) {
    this[styleSymbol] = info;
  }

  get style(): VisualInfo | undefined {
    return this[styleSymbol];
  }
}

export class IIndexTypeItem {
  name: string;
  forTarget: INodeTypeItem | IEdgeTypeItem;
  on: Array<IProperty & { order: 'acs' | 'desc' }>;
  ifNotExits: boolean;

  constructor(params: Omit<IIndexTypeItem, typeof idSymbol | 'id' | 'updateValues'>) {
    this.name = params.name;
    this.forTarget = params.forTarget;
    this.on = params.on;
    this.ifNotExits = params.ifNotExits;
  }

  updateValues = (values: Omit<IIndexTypeItem, typeof idSymbol | 'id'>) => {
    const { name, forTarget, on, ifNotExits } = values;
    this.name = name;
    this.forTarget = forTarget;
    this.on = on;
    this.ifNotExits = ifNotExits;
  };
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
