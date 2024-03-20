import { PropertyDataType, VisualEditorType } from '@/utils/constant';
// import { SystemStyleObject } from '@mui/system';
// import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
// import { InstanceNodePoint } from '@vesoft-inc/veditor/types/Shape/Node';

const idSymbol = Symbol('id');

export class IProperty {
  name: string;
  type: PropertyDataType;
  value?: string;
  allowNull?: boolean;
  fixedLength?: string;
  comment?: string;
  showType?: string;
  [idSymbol]: string;

  constructor({ name, type }: { name: string; type: PropertyDataType }) {
    this.name = name;
    this.type = type;
    this[idSymbol] = Math.random().toString();
  }

  get id() {
    return this[idSymbol];
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

export interface INodeTypeItem {
  name: string;
  primaryKey: string;
  properties: IProperty[];
  labels: string[];
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
