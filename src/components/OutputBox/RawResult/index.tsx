import { useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@emotion/react';
import MonacoEditor from '@/components/MonacoEditor';
import type { ConsoleResult } from '@/interfaces/console';

export default function RawResult({ result }: { result: ConsoleResult }) {
  const themeMode = useTheme().palette.mode;
  const { headers = [], tables = [] } = result.data || {};
  const [dstStr] = useState(() => {
    const dst = tables.map((item) => {
      const obj = headers.reduce(
        (acc, key) => {
          const value = item[key];
          const isNebulaType = value && typeof value === 'object' && 'raw' in value;
          acc[key] = isNebulaType ? value.raw : value;
          return acc;
        },
        {} as Record<string, unknown>
      );
      return obj;
    });
    return JSON.stringify(dst, headers, 2);
  });

  return (
    <Box m={0} p={1} height="100%" overflow="auto">
      <MonacoEditor value={dstStr} readOnly language="javascript" themeMode={themeMode} />
    </Box>
  );
}
