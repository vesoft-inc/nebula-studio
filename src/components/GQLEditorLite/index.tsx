import { Suspense, lazy, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@emotion/react';
import { Range, type languages, IDisposable } from '@/components/MonacoEditor/monaco';
import type { MonacoEditorProps } from '@/components/MonacoEditor';
import { GQL_LANG_ID as langId } from '@/utils/constant/editor';
import { GQL_KEYWORDS, GQL_PROCEDURES } from '@/utils/constant/nebula';

export const LazyMonacoEditor = lazy(() => import('@/components/MonacoEditor'));

export const highlightKeywords = [...GQL_KEYWORDS, ...GQL_KEYWORDS.map((k) => k.toLowerCase()), ...GQL_PROCEDURES];

interface IProps {
  value: string;
  onChange: (value?: string) => void;
}

export default function GQLEditorLite(props: IProps) {
  const theme = useTheme();
  const disposeRef = useRef<{ name: string; disposer: IDisposable }[]>([]);

  const onMount = useCallback<NonNullable<MonacoEditorProps['onMount']>>((_editor, monaco) => {
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
    const highlightDisposer = monaco?.languages.setMonarchTokensProvider(langId, {
      keywords: highlightKeywords,
      tokenizer: {
        root: [[/[a-zA-Z_$][\w$]*/i, { cases: { '@keywords': { token: 'keyword' } } }]],
      },
    });
    const keywordDisposer = monaco?.languages.registerCompletionItemProvider(langId, {
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
    disposeRef.current.push(
      { name: 'highlightDisposer', disposer: highlightDisposer! },
      { name: 'keywordDisposer', disposer: keywordDisposer! }
    );
  }, []);

  useEffect(
    () => () => {
      disposeRef.current.forEach(({ disposer }) => disposer?.dispose());
      disposeRef.current = [];
    },
    []
  );

  const { value, onChange } = props;

  return (
    <Suspense>
      <LazyMonacoEditor
        language={langId}
        themeMode={theme.palette.mode}
        value={value}
        onChange={onChange}
        onMount={onMount}
      />
    </Suspense>
  );
}
