export interface GQLResult<T extends object = Record<string, unknown>> {
  headers: string[];
  latency: number;
  /** JSON string */
  planDesc: string;
  tables: T[];
}

export type ConsoleResult<T extends object = Record<string, unknown>> = {
  id: string;
  gql: string;
  code: number;
  message: string;
  data?: GQLResult<T>;
};
