import { useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@emotion/react';
import MonacoEditor from '@/components/MonacoEditor';
import type { ConsoleResult } from '@/interfaces/console';
import { JSONBig, transformNebulaResult } from '@/utils';

export default function RawResult({ result }: { result: ConsoleResult }) {
  const themeMode = useTheme().palette.mode;
  const { headers = [], tables = [] } = result.data || {};
  const [dstStr] = useState(() => {
    const dst = tables.map((item) => {
      const obj = headers.reduce(
        (acc, key) => {
          acc[key] = transformNebulaResult(item[key]);
          return acc;
        },
        {} as Record<string, unknown>
      );
      return obj;
    });
    return JSONBig.stringify(dst, null, 2);
  });

  return (
    <Box m={0} p={1} height="100%" overflow="auto">
      <MonacoEditor value={dstStr} readOnly language="javascript" themeMode={themeMode} />
    </Box>
  );
}
