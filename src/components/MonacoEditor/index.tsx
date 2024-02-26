import { useEffect } from 'react';
import { css } from '@emotion/css';
import * as monaco from 'monaco-editor';
import Editor, { loader, useMonaco } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

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

interface MonacoEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  themeMode?: string;
}

export default function MonacoEditor(props: MonacoEditorProps) {
  const { themeMode } = props;
  const monaco = useMonaco();
  const isDark = themeMode === 'dark';
  const className = css`
    min-height: 120px;
    height: 100%;
  `;

  useEffect(() => {
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
    <Editor
      height="100%"
      theme={monacoTheme}
      defaultLanguage="javascript"
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
        readOnly: false,
        minimap: { enabled: false },
        fontSize: 14,
        tabSize: 2,
        padding: { top: 4, bottom: 4 },
        fontFamily: 'Menlo, Monaco',
        automaticLayout: true,
        fixedOverflowWidgets: true,
      }}
      className={className}
    />
  );
}
