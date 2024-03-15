import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Explain from '@vesoft-inc/nebula-explain-graph';
import { ExplainData } from '@vesoft-inc/nebula-explain-graph/types/Shape';
import '@vesoft-inc/nebula-explain-graph/dist/Explain.css';
import type { ConsoleResult } from '@/interfaces/console';
import { safeParse } from '@/utils';

export default function PlanResult({ result }: { result: ConsoleResult }) {
  const { planDesc } = result.data || {};
  const [explainData, setExplainData] = useState<ExplainData | undefined>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!planDesc) {
      return;
    }
    const [explainData, error] = safeParse<ExplainData>(planDesc);
    explainData && setExplainData(explainData);
    error && setError(error);
  }, []);

  if (error) {
    return <Box sx={{ p: 2, color: ({ palette }) => palette.vesoft.status4 }}>{error.message}</Box>;
  }

  return <Explain data={explainData} style={{ height: '100%' }} />;
}
