import { action, makeObservable, observable } from 'mobx';
import { v4 as uuid } from 'uuid';
import { execGql } from '@/services';
import type { Graph, GraphTypeElement } from '@/interfaces';
import type { GQLResult, ConsoleResult } from '@/interfaces/console';
import type { editor } from 'monaco-editor';
import { type RootStore } from '.';

export class ConsoleStore {
  rootStore?: RootStore;

  graphs: Graph[] = [];
  graphTypeElements = observable.array<GraphTypeElement>([]);
  editorRef?: editor.IStandaloneCodeEditor = undefined;
  editorValue = '';
  editorRunning = false;
  quickActionModalOpen = false;
  results = observable.array<ConsoleResult>([], { deep: false });

  constructor(rootStore?: RootStore) {
    makeObservable(this, {
      // observable properties
      graphs: observable.ref,
      rootStore: observable.ref,
      editorRef: observable.ref,
      editorValue: observable,
      editorRunning: observable,
      quickActionModalOpen: observable,
      results: observable.shallow,

      // actions
      updateGraphs: action,
      updateGraphTypes: action,
      updateEditorValue: action,
      updateResults: action,
      addResult: action,
      removeResult: action,
      setQuickActionModalOpen: action,
      setEditorRef: action,
    });
    this.rootStore = rootStore;
  }

  updateGraphs = (graphs: Graph[]) => (this.graphs = graphs);
  updateGraphTypes = (elements: GraphTypeElement[]) => this.graphTypeElements.replace(elements);
  updateEditorValue = (value: string = '') => (this.editorValue = value);
  updateResults = (results: ConsoleResult[]) => this.results.replace(results);
  addResult = (result: ConsoleResult) => this.results.unshift(result);
  removeResult = (result: ConsoleResult) => this.results.remove(result);
  setQuickActionModalOpen = (open: boolean) => (this.quickActionModalOpen = open);
  setEditorRef = (ref?: editor.IStandaloneCodeEditor) => {
    this.editorRef = ref;
  };

  /**
   * unsafe action, **never make `fn` async**
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

  getGraphs = async () => {
    const gql = [
      'CALL show_graphs() YIELD `graph_name` as name',
      'CALL describe_graph(name) YIELD `graph_name`, `graph_type_name`',
      'RETURN graph_name, graph_type_name',
    ].join(' ');
    const res = await execGql<GQLResult<{ graph_name: string; graph_type_name: string }>>(gql);
    const graphs = res.data?.tables?.map((item) => ({ name: item.graph_name, typeName: item.graph_type_name })) || [];
    this.updateGraphs(graphs);
  };

  getGraphTypes = async () => {
    const gql = `CALL show_graph_types() YIELD \`graph_type_name\` AS name CALL describe_graph_type(name) RETURN *`;
    const res = await execGql<GQLResult<GraphTypeElement>>(gql);
    const elements = res.data?.tables || [];
    this.updateGraphTypes(elements);
  };

  runGql = async (gql: string) => {
    gql = gql.trim();
    if (!gql) {
      return;
    }
    this.unsafeAction(() => (this.editorRunning = true));
    const res = await execGql<GQLResult>(gql);
    setTimeout(() => {
      this.unsafeAction(() => {
        const message = res.message.replace(/^\w+::/, '');
        const result = { ...res, message, id: uuid(), gql, destroy: () => this.removeResult(result) };
        this.results.unshift(result);
        this.editorRunning = false;
      });
    }, 200);
  };
}
