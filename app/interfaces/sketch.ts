import { VEditorLine, VEditorNode } from '@vesoft-inc/veditor/types/Model/Schema';

export interface IProperty {
  name: string;
  type: string;
  fixedLength: string;
}
export interface ISketchNode extends VEditorNode {
  uuid?: string;
  type: string;
  fill?: string;
  strokeColor?: string;
  properties: IProperty[];
  name?: string;
  comment?: string;
  invalid: boolean;
}

export interface ISketchEdge extends VEditorLine {
  uuid?: string;
  type?: string;
  fromPoint?: number;
  toPoint?: number;
  from: string;
  name?: string;
  to: string;
  properties?: IProperty[];
  comment?: string;
  invalid: boolean;
}

export enum ISketchType {
  SketchNode = 'tag',
  SketchLine = 'edge',
}

export interface ISketch {
  id: string;
  name: string;
  schema: string;
  snapshot: string;
  createTime: number;
  updateTime: number;
}
