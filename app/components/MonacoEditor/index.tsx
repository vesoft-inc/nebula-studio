import { useCallback, useEffect, useMemo, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import {
  keyWords,
  operators,
  nebulaFunction,
  nebulaWordsUppercase,
  propertyReference,
  parameterDeclaration,
} from '@app/config/nebulaQL';
import { useI18n } from '@vesoft-inc/i18n';
import { handleEscape } from '@app/utils/function';
interface IProps {
  schemaHint?: any;
  onInstanceChange?: (instance: any) => void;
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

const checkNeedEscape = (str) => {
  // check if it starts with a number or contains special characters or is a keyword
  return /^\d/.test(str) || /[^A-Za-z0-9_]/.test(str) || keyWords.includes(str.toUpperCase());
};

const regexFormat = (list) => {
  return list.map((i) => {
    let item = handleEscape(i).replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
    if (checkNeedEscape(i)) {
      item = `\`${item}\``;
    }
    return item;
  });
};

const getInsertProvideText = (str) => {
  if (checkNeedEscape(str)) {
    return `\`${handleEscape(str)}\``;
  }
  return str;
};

// create highlight rule regex for tag & edge
const createSchemaRegex = (patterns, words, type) => {
  if (words.length === 0) {
    return [];
  }
  const wordPattern = words.join('|');
  return patterns.map((pattern) => [new RegExp(pattern.replace('WORDS', wordPattern), 'g'), type]);
};

const patterns = [
  '\\b(WORDS)\\b',
  '(^|\\s)(WORDS)(\\s|$)', // There can be spaces before and after the string
  '(?<=^|\\s|\\.\\s|:\\s)(WORDS)', // There can be a '.' or ':' before the string.
];
const MonacoEditor = (props: IProps) => {
  const { intl, currentLocale } = useI18n();
  const monaco = useMonaco();
  const providersRef = useRef([]);
  const { schemaHint, value, onChange, readOnly, onInstanceChange } = props;
  const tags = useMemo(() => schemaHint?.tagList?.map((i) => i.name) || [], [schemaHint]);
  const edges = useMemo(() => schemaHint?.edgeList?.map((i) => i.name) || [], [schemaHint]);
  const fields = useMemo(
    () =>
      [...(schemaHint?.tagList || []), ...(schemaHint?.edgeList || [])]
        .map((k) =>
          k.fields.map((f) => ({
            name: f.Field,
            type: f.Type,
            parent: k.name,
          })),
        )
        .flat(),
    [schemaHint],
  );
  const setMonacoProvider = useCallback(() => {
    // register syntax highlighting
    const highlightProvider = monaco?.languages.setMonarchTokensProvider('ngql', {
      keywords: keyWords,
      operators,
      tags,
      edges,
      propertyReference,
      tokenizer: {
        //@ts-ignore
        root: [
          ...createSchemaRegex(patterns, regexFormat(tags), 'tag'),
          ...createSchemaRegex(patterns, regexFormat(edges), 'edge'),
          [new RegExp('^\\s*(//|#).*', 'gm'), 'comment'], // start with // or # is comment
          [
            /[a-zA-Z_$][\w$]*/,
            {
              cases: {
                '@keywords': { token: 'keyword' },
              },
            },
          ],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/`.*?`/, 'string'],
        ].filter(Boolean),
      },
    });
    // register a completion item provider for keywords
    const keywordProvider = monaco?.languages.registerCompletionItemProvider('ngql', {
      //@ts-ignore
      provideCompletionItems: () => {
        const suggestions = [
          ...nebulaWordsUppercase.map((k) => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: k,
            detail: intl.get('common.keyword'),
            sortText: '1', // monaco completion suggestions sort by sortText, 1: keyword 2: tag 3: edge 4: field 5: function
          })),
        ];
        return { suggestions: suggestions };
      },
    });
    const parameterProvider = monaco?.languages.registerCompletionItemProvider('ngql', {
      //@ts-ignore
      provideCompletionItems: () => {
        const suggestions = [
          ...parameterDeclaration.map((k) => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Enum,
            insertText: k.slice(1),
            sortText: '1', // monaco completion suggestions sort by sortText, 1: keyword 2: tag 3: edge 4: field 5: function
          })),
        ];
        return { suggestions: suggestions };
      },
      triggerCharacters: [':'],
    });

    const propertyReferenceProvider = monaco?.languages.registerCompletionItemProvider('ngql', {
      //@ts-ignore
      provideCompletionItems: () => {
        const suggestions = [
          ...propertyReference.map((k) => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: k.slice(1),
            sortText: '1', // monaco completion suggestions sort by sortText, 1: keyword 2: tag 3: edge 4: field 5: function
          })),
        ];
        return { suggestions: suggestions };
      },
      triggerCharacters: ['$'],
    });
    // register a completion item provider for tags and edges, can trigger by ':' and '.'
    const schemaInfoProvider = monaco?.languages.registerCompletionItemProvider('ngql', {
      provideCompletionItems: () => {
        const suggestions = [
          ...tags.map((k: string) => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Property,
            detail: intl.get('common.tag'),
            insertText: getInsertProvideText(k),
            sortText: '2',
          })),
          ...edges.map((k: string) => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Property,
            detail: intl.get('common.edge'),
            insertText: getInsertProvideText(k),
            sortText: '3',
          })),
          ...fields.map((field: { name: string; parent: string; type: string }) => ({
            label: field.name,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: `${field.parent}.${field.name}(${field.type}))`,
            insertText: getInsertProvideText(field.name),
            sortText: '4',
          })),
        ];
        return { suggestions };
      },
      triggerCharacters: [':', '.'],
    });
    const regex = /^properties\(.*\)$/g; // match properties()
    // register a completion item provider for fields, can trigger by '.'
    const schemaInfoTriggerProvider = monaco?.languages.registerCompletionItemProvider('ngql', {
      //@ts-ignore
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const words = textUntilPosition.split(' ');
        const lastWord = words[words.length - 1].slice(0, -1); // get the last word and remove the last character '.'
        const suggestions = fields
          .filter((field) => field.parent === lastWord || regex.test(lastWord))
          .map((field) => ({
            label: field.name,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: `${field.parent}.${field.name}(${field.type}))`,
            insertText: getInsertProvideText(field.name),
            sortText: '4',
          }));

        return { suggestions };
      },
      triggerCharacters: ['.'],
    });
    // register a completion item provider for functions
    const funcProvider = monaco?.languages.registerCompletionItemProvider('ngql', {
      //@ts-ignore
      provideCompletionItems: () => {
        const suggestions = nebulaFunction.map((f) => ({
          label: `${f}()`,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: intl.get('common.function'),
          insertText: `${f}($1)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          sortText: '5',
        }));

        return { suggestions };
      },
    });
    providersRef.current = [
      highlightProvider,
      parameterProvider,
      keywordProvider,
      propertyReferenceProvider,
      schemaInfoProvider,
      schemaInfoTriggerProvider,
      funcProvider,
    ];
  }, [currentLocale, monaco, tags, edges, fields]);
  const clearProviders = useCallback(() => {
    if (providersRef.current.length > 0) {
      providersRef.current.forEach((provider) => provider?.dispose());
      providersRef.current = [];
    }
  }, []);
  useEffect(() => {
    if (!monaco) return;
    const languages = monaco.languages.getLanguages();
    if (languages.some((i) => i.id == 'ngql')) return;
    monaco?.languages.register({ id: 'ngql' });
    monaco?.editor.defineTheme('studio', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '808080' }, // comment color
        { token: 'tag', foreground: 'F4C56F' }, // tag color
        { token: 'edge', foreground: 'bff46f' }, // edge color
        { token: 'field', foreground: 'FFA500' }, // edge color
        { token: 'keyword', foreground: '770088' }, // keyword color
      ],
      colors: {
        'editorGutter.background': '#8383831A', // line number gutter color
        'editorLineNumber.foreground': '#000000', // line number color
        'editor.foreground': '#000000',
        'editorCursor.foreground': '#00BFA5', // Set cursor color
      },
    });
    monaco?.editor.setTheme('studio');
    monaco?.languages.setLanguageConfiguration('ngql', {
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' },
      ],
    });
    setMonacoProvider();
  }, [monaco]);
  useEffect(() => {
    if (!schemaHint?.space && !monaco?.editor) return;
    clearProviders();
    monaco?.editor && setMonacoProvider();
    return () => {
      clearProviders();
    };
  }, [schemaHint]);
  return (
    <Editor
      height="300px"
      defaultLanguage="ngql"
      value={value}
      onChange={onChange}
      theme="studio"
      options={{
        cursorStyle: 'block',
        // lineNumbersMinChars: 0,
        // glyphMargin: true,
        lineDecorationsWidth: 0,
        renderLineHighlight: 'none',
        readOnly,
        minimap: {
          enabled: false,
        },
      }}
      onMount={(editor) => onInstanceChange?.(editor)}
    />
  );
};

export default MonacoEditor;
