import { Suspense, lazy, useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useTheme } from '@emotion/react';
import { KeyMod, KeyCode, Range, type languages, IDisposable } from '@/components/MonacoEditor/monaco';
import Box from '@mui/material/Box';
import * as monaco from '@/components/MonacoEditor/monaco';
import { useStore } from '@/stores';
import type { MonacoEditorProps } from '@/components/MonacoEditor';
import { GQL_LANG_ID as langId } from '@/utils/constant/editor';
import { GQL_KEYWORDS, GQL_PROCEDURES } from '@/utils/constant/nebula';
import { StyledChip } from './styles';

const MonacoEditor = lazy(() => import('@/components/MonacoEditor'));
const keywords = [...GQL_KEYWORDS, ...GQL_KEYWORDS.map((k) => k.toLowerCase()), ...GQL_PROCEDURES];

export default observer(function GQLEditor() {
  const theme = useTheme();
  const rootStore = useStore();
  const disposeRef = useRef<{ name: string; disposer: IDisposable }[]>([]);
  const { consoleStore } = rootStore;
  const { graphs } = consoleStore;

  const onShiftEnter = useCallback(() => {
    const { consoleStore } = rootStore;
    consoleStore.runGql(consoleStore.editorValue);
  }, []);

  const onMount = useCallback<NonNullable<MonacoEditorProps['onMount']>>((editor, monaco) => {
    // quick submit
    editor?.addCommand(KeyMod.Shift | KeyCode.Enter, onShiftEnter);

    // open quick action modal
    editor?.onKeyDown((e) => {
      if (e.metaKey && e.code === 'KeyK') {
        e.preventDefault();
        rootStore?.consoleStore?.setQuickActionModalOpen(true);
      }
    });

    // register gql language
    const languages = monaco?.languages.getLanguages() || [];
    if (!languages.some((lang) => lang.id === langId)) {
      monaco?.languages.register({ id: langId });
      monaco?.languages.setLanguageConfiguration(langId, {
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: '`', close: '`' },
        ],
      });
    }
    const highlightProvider = monaco?.languages.setMonarchTokensProvider(langId, {
      keywords,
      tokenizer: {
        root: [[/[a-zA-Z_$][\w$]*/i, { cases: { '@keywords': { token: 'keyword' } } }]],
      },
    });
    const keywordProvider = monaco?.languages.registerCompletionItemProvider(langId, {
      provideCompletionItems: (model, position) => {
        const wordInfo = model.getWordUntilPosition(position);
        const wordRange = new Range(position.lineNumber, wordInfo.startColumn, position.lineNumber, wordInfo.endColumn);
        const keywordSuggestions: languages.CompletionItem[] = GQL_KEYWORDS.map((k) => ({
          label: k,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          detail: 'Keyword',
          range: wordRange,
          // monaco completion suggestions sort by sortText, 1: keyword 2: tag 3: edge 4: field 5: function
          sortText: '2',
        }));
        const procedureSuggestions: languages.CompletionItem[] = GQL_PROCEDURES.map((p) => ({
          label: p,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: p,
          detail: 'Procedure',
          range: wordRange,
          sortText: '1',
        }));
        return { suggestions: [...keywordSuggestions, ...procedureSuggestions] };
      },
    });
    const inlineSuggestionProvider = monaco?.languages.registerInlineCompletionsProvider(langId, {
      async provideInlineCompletions(model, position, _context, _token) {
        const lineContent = model.getLineContent(position.lineNumber);
        if (/use$/i.test(lineContent)) {
          const firstGraph = consoleStore.graphs[0]?.name;
          return { items: firstGraph ? [{ insertText: `USE ${firstGraph} MATCH (v) RETURN v LIMIT 1` }] : [] };
        } else if (/show$/i.test(lineContent)) {
          return { items: [{ insertText: 'SHOW GRAPH TYPES' }] };
        }
        return { items: [] };
      },
      freeInlineCompletions() {},
    });
    disposeRef.current.push(
      { name: 'highlightProvider', disposer: highlightProvider! },
      { name: 'keywordProvider', disposer: keywordProvider! },
      { name: 'inlineSuggestionProvider', disposer: inlineSuggestionProvider! }
    );
    rootStore?.consoleStore?.setEditorRef(editor);
  }, []);

  useEffect(() => {
    const graphNames = graphs.map((g) => g.name);
    if (!graphNames.length) {
      return;
    }
    const graphProvider = monaco?.languages.registerCompletionItemProvider(langId, {
      provideCompletionItems: (model, position) => {
        // get current line text
        const line = model.getLineContent(position.lineNumber);
        const endsWithUse = /use\s+$/i.test(line);
        if (!endsWithUse) {
          return { suggestions: [] };
        }
        const wordInfo = model.getWordUntilPosition(position);
        const wordRange = new Range(position.lineNumber, wordInfo.startColumn, position.lineNumber, wordInfo.endColumn);
        const suggestions: languages.CompletionItem[] = graphNames.map((name) => ({
          label: name,
          kind: monaco.languages.CompletionItemKind.Text,
          insertText: name,
          detail: 'Graph',
          range: wordRange,
        }));
        return { suggestions };
      },
      triggerCharacters: [' '],
    });
    const dispose = () => {
      const item = disposeRef.current.find((p) => p.name === 'graphProvider');
      if (item) {
        item.disposer?.dispose();
        disposeRef.current = disposeRef.current.filter((p) => p !== item);
      }
    };
    disposeRef.current.push({ name: 'graphProvider', disposer: graphProvider! });
    return dispose;
  }, [graphs]);

  useEffect(
    () => () => {
      disposeRef.current.forEach(({ disposer }) => disposer?.dispose());
      disposeRef.current = [];
      rootStore?.consoleStore?.setEditorRef();
    },
    []
  );

  const { editorValue, updateEditorValue } = consoleStore;
  return (
    <Suspense>
      <MonacoEditor
        language={langId}
        themeMode={theme.palette.mode}
        value={editorValue}
        onChange={updateEditorValue}
        onMount={onMount}
        placeholder={
          <>
            <Box>
              Input <StyledChip label="USE / SHOW" size="small" /> to quick query
            </Box>
            <Box>
              Run GQL <StyledChip label="Shift + Enter" size="small" />
            </Box>
            <Box>
              Focus Editor <StyledChip label="/" size="small" />
            </Box>
          </>
        }
      />
    </Suspense>
  );
});
