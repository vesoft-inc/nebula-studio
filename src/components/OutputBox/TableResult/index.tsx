import Box from '@mui/material/Box';
import { Table } from '@vesoft-inc/ui-components';
import type { ConsoleResult } from '@/interfaces/console';
import { JSONBig, transformNebulaResult } from '@/utils';

export default function TableResult({ result }: { result: ConsoleResult }) {
  const { headers = [], tables = [] } = result.data || {};
  const columns = headers.map((header) => ({ accessorKey: header, header }));
  const data = tables.map((item) => {
    const obj = headers.reduce(
      (acc, key) => {
        acc[key] = JSONBig.stringify(transformNebulaResult(item[key]));
        return acc;
      },
      {} as Record<string, unknown>
    );
    return obj;
  });
  return (
    <Box m={0} p={1} height="100%" overflow="hidden">
      <Table
        columns={columns}
        data={data}
        renderBottomToolbar={false}
        enableStickyHeader
        muiTableContainerProps={{ sx: { maxHeight: '280px' } }}
      />
    </Box>
  );
}
