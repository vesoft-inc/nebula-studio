import { v4 as uuid } from 'uuid';
import { PropertyDataType, VisualEditorType } from '@/utils/constant';
// import { SystemStyleObject } from '@mui/system';
// import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
// import { InstanceNodePoint } from '@vesoft-inc/veditor/types/Shape/Node';

const idSymbol = Symbol('id');

export class IProperty {
  name: string;
  type: PropertyDataType;
  isPrimaryKey?: boolean = false;
  [idSymbol]: string;

  constructor(params?: Omit<IProperty, typeof idSymbol | 'id'>) {
    this.name = params?.name || '';
    this.type = params?.type || PropertyDataType.STRING;
    this.isPrimaryKey = params?.isPrimaryKey;
    this[idSymbol] = uuid();
  }

  get id() {
    return this[idSymbol];
  }
}

export class INodeTypeItem {
  [idSymbol]: string;
  name: string;
  properties: IProperty[] = [];
  labels: string[] = [];
  constructor(params?: Omit<INodeTypeItem, typeof idSymbol | 'id' | 'updateValues'>) {
    this[idSymbol] = uuid();
    this.name = params?.name || '';
    this.properties = params?.properties || [];
    this.labels = params?.labels || [];
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
}

export class IEdgeTypeItem {
  [idSymbol]: string;
  name: string;
  properties: IProperty[] = [];
  labels: string[] = [];
  srcNode: INodeTypeItem;
  dstNode: INodeTypeItem;
  constructor(params: Omit<IEdgeTypeItem, typeof idSymbol | 'id' | 'updateValues'>) {
    this[idSymbol] = uuid();
    this.name = params.name || '';
    this.srcNode = params.srcNode;
    this.dstNode = params.dstNode;
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
}

export interface VisualNodeCustomizeInfo {
  fill?: string;
  strokeColor?: string;
  shadow?: string;
  type?: VisualEditorType.Tag;
  name?: string;
  comment?: string;
  properties?: IProperty[];
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
