import type { ConsoleResult } from '@/interfaces/console';
import Box from '@mui/material/Box';
import { Table } from '@vesoft-inc/ui-components';

export default function TableResult({ result }: { result: ConsoleResult }) {
  const { headers = [], tables = [] } = result.data || {};
  const columns = headers.map((header) => ({ accessorKey: header, header }));
  const data = tables.map((item) => {
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
