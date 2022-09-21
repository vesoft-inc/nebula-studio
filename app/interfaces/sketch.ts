import { VEditorLine, VEditorNode } from '@vesoft-inc/veditor/types/Model/Schema';
import { ISchemaEnum } from './schema';

export interface IProperty {
  name: string;
  type: string;
  fixedLength: string;
}
export interface ISketchNode extends VEditorNode {
  uuid?: string;
  type: ISchemaEnum.Tag;
  fill?: string;
  strokeColor?: string;
  properties: IProperty[];
  name?: string;
  comment?: string;
  invalid: boolean;
}

export interface ISketchEdge extends VEditorLine {
  uuid?: string;
  type: ISchemaEnum.Edge;
  fromPoint?: number;
  toPoint?: number;
  from: string;
  name?: string;
  to: string;
  properties?: IProperty[];
  comment?: string;
  invalid: boolean;
}

export interface ISketch {
  id: string;
  name: string;
  schema: string;
  snapshot: string;
  createTime: number;
  updateTime: number;
}
