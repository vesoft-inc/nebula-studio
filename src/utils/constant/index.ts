export enum PageRoute {
  GraphType = 'graphtype',
  ImportData = 'importer',
  Console = 'console',
}

export enum VisualEditorType {
  Tag = 'tag',
  Edge = 'edge',
}

export enum PropertyDataType {
  STRING = 'STRING',
  DATE = 'DATE',
  INT64 = 'INT64',
  INT32 = 'INT32',
  BOOL = 'BOOL',
  LOCAL_DATETIME = 'LOCAL DATETIME',
}

export enum EdgeDirectionType {
  /** 正向 */
  Forward = 1,
  /** 无向 */
  Undirected,
  /** 反向 */
  Backword,
}

export enum MultiEdgeKeyMode {
  /** 不允许平行边 */
  None = 1,
  /** 允许平行边，自增长 */
  Auto,
  /** 允许平行边，自定义属性*/
  Customize,
}
