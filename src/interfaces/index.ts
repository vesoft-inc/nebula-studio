import { VisualEditorType } from '@/utils/constant';
import { SystemStyleObject } from '@mui/system';
import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
import { InstanceNodePoint } from '@vesoft-inc/veditor/types/Shape/Node';

export interface IProperty {
  name: string;
  type: string;
  value?: string;
  allowNull?: boolean;
  fixedLength?: string;
  comment?: string;
  showType?: string;
}

export interface VisualEditorNode extends InstanceNodePoint {
  fill: string;
  strokeColor: string;
  shadow: string;
  type: VisualEditorType.Tag;
  name?: string;
  comment?: string;
  properties: IProperty[];
  invalid: boolean;
}

export interface VisualEditorLine extends InstanceLine {
  from: VisualEditorNode;
  to: VisualEditorNode;
  name: string;
  type: VisualEditorType.Edge;
  fromPoint: number;
  toPoint: number;
  graphIndex: number;
  style: SystemStyleObject;
  arrowStyle: SystemStyleObject;
  properties: IProperty[];
  textBackgroundColor: string;
}

export interface DraggingTag {
  fill: string;
  strokeColor: string;
  shadow: string;
  type: 'tag';
  name: undefined;
  comment: undefined;
  properties: [];
  invalid: false;
}
