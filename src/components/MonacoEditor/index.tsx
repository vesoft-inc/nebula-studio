import { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import { css } from '@emotion/css';
import * as monaco from './monaco';
import Editor, { loader, useMonaco } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

type Monaco = typeof monaco;

// avoid loading monaco twice
if (!loader.__getMonacoInstance()) {
  loader.config({ monaco });
  loader.init();

  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    },
  };
}

export interface MonacoEditorProps {
  value?: string;
  onChange?: (value?: string) => void;
  /** dark | light */
  themeMode?: string;
  readOnly?: boolean;
  language?: string;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monaco?: Monaco) => void;
  placeholder?: React.ReactNode;
}

export default function MonacoEditor(props: MonacoEditorProps) {
  const { themeMode = 'light', onChange, value, readOnly = false, language, onMount, placeholder } = props;
  const monaco = useMonaco();
  const isDark = themeMode === 'dark';
  const className = css`
    min-height: 120px;
    height: 100%;
    /* .lines-content.monaco-editor-background {
      padding-left: 4px;
    } */
  `;

  useEffect(() => {
    monaco?.editor;
    if (isDark) {
      monaco?.editor.defineTheme('vs-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#092332',
          'editorGutter.background': '#323C42', // line number gutter color
          'editorLineNumber.foreground': '#A1A1AA', // line number color
          'editorLineNumber.activeForeground': '#A1A1AA',
          focusBorder: '#3F3F46',
        },
      });
      return;
    }

    monaco?.editor.defineTheme('light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editorGutter.background': '#f3f3f3',
        'editorLineNumber.foreground': '#A1A1AA', // line number color
        'editorLineNumber.activeForeground': '#A1A1AA',
        focusBorder: '#E4E4E7',
      },
    });
  }, [themeMode]);

  const monacoTheme = isDark ? 'vs-dark' : 'light';
  return (
    <>
      <Editor
        height="100%"
        theme={monacoTheme}
        value={value}
        language={language}
        options={{
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
          },
          roundedSelection: false,
          scrollBeyondLastLine: false,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          overviewRulerLanes: 0,
          lineNumbersMinChars: 3,
          // glyphMargin: true,
          lineDecorationsWidth: 0,
          renderLineHighlight: 'none',
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          tabSize: 2,
          padding: { top: 4, bottom: 4 },
          fontFamily: 'Menlo, Monaco',
          automaticLayout: true,
          fixedOverflowWidgets: true,
        }}
        className={className}
        onChange={onChange}
        onMount={onMount}
      />
      {placeholder && (
        <Typography
          sx={{
            position: 'absolute',
            left: '44px',
            top: '2px',
            color: ({ palette }) => palette.action.disabled,
            display: value ? 'none' : 'inherit',
            userSelect: 'none',
            cursor: 'text',
            fontSize: '14px',
            opacity: 0.5,
          }}
          component="code"
          variant="subtitle1"
          onClick={() => monaco?.editor.getEditors()?.[0]?.focus()}
        >
          {placeholder}
        </Typography>
      )}
    </>
  );
}
