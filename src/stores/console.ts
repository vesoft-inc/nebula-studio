import { action, makeObservable, observable } from 'mobx';
import { v4 as uuid } from 'uuid';
import { execGql } from '@/services';
import type { Graph, GraphTypeElement } from '@/interfaces';
import type { GQLResult, ConsoleResult } from '@/interfaces/console';
import { type RootStore } from '.';

export class ConsoleStore {
  rootStore?: RootStore;

  graphs = observable.array<Graph>([]);
  graphTypeElements = observable.array<GraphTypeElement>([]);
  editorValue = '';
  results = observable.array<ConsoleResult>([], { deep: false });

  constructor(rootStore?: RootStore) {
    makeObservable(this, {
      // observable properties
      graphs: observable.shallow,
      rootStore: observable.ref,
      editorValue: observable,
      results: observable.shallow,

      // actions
      updateGraphs: action,
      updateGraphTypes: action,
      updateEditorValue: action,
      updateResults: action,
      unsafeAction: action,
    });
    this.rootStore = rootStore;
  }

  updateGraphs = (graphs: Graph[]) => this.graphs.replace(graphs);
  updateGraphTypes = (elements: GraphTypeElement[]) => this.graphTypeElements.replace(elements);
  updateEditorValue = (value: string = '') => (this.editorValue = value);
  updateResults = (results: ConsoleResult[]) => this.results.replace(results);
  addResult = (result: ConsoleResult) => this.results.unshift(result);
  removeResult = (result: ConsoleResult) => this.results.remove(result);

  /**
   * unsafe action
   * - update observable properties in `fn`
   * ```ts
   * unsafeAction(() => {
   *  this.editorValue = 'new value';
   *  this.results.delete(item);
   * });
   * ```
   * - use `action` to wrap `fn` for batched updates
   * ```ts
   * unsafeAction(() => {
   *  this.updateGraphs(graphs);
   *  this.updateResults(results);
   * });
   * ```
   */
  unsafeAction = (fn: () => void) => action('unsafeAction', fn)();

  getGraphTypes = async () => {
    const gql = `CALL show_graph_types() YIELD \`graph_type_name\` AS name CALL describe_graph_type(name) RETURN *`;
    const res = await execGql<GQLResult<GraphTypeElement>>(gql);
    const elements = res.data?.tables || [];
    this.updateGraphTypes(elements);
  };

  runGql = async (gql: string) => {
    const res = await execGql<GQLResult>(gql);
    this.unsafeAction(() => {
      const message = res.message.replace(/^\w+::/, '');
      this.results.unshift({ ...res, message, id: uuid(), gql });
    });
  };
}
