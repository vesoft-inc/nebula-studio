import { VisualEditorType } from '@/utils/constant';
// import { SystemStyleObject } from '@mui/system';
// import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
// import { InstanceNodePoint } from '@vesoft-inc/veditor/types/Shape/Node';

export interface IProperty {
  name: string;
  type: string;
  value?: string;
  allowNull?: boolean;
  fixedLength?: string;
  comment?: string;
  showType?: string;
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
