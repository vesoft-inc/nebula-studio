import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import { Table } from '@vesoft-inc/ui-components';
import { MRT_Localization_ZH_HANS } from 'material-react-table/locales/zh-Hans';
import type { ConsoleResult } from '@/interfaces/console';
import { useStore } from '@/stores';
import { JSONBig, transformNebulaResult } from '@/utils';

export default observer(function TableResult({ result }: { result: ConsoleResult }) {
  const { commonStore } = useStore();
  const { headers = [], tables = [] } = result.data || {};
  const columns = headers.map((header) => ({
    accessorFn: (row: Record<string, string>) => row[header],
    header,
  }));
  const data = tables.map((item) => {
    const obj = headers.reduce(
      (acc, key) => {
        acc[key] = JSONBig.stringify(transformNebulaResult(item[key]));
        return acc;
      },
      {} as Record<string, string>
    );
    return obj;
  });
  const localization = commonStore.isEnLang ? undefined : MRT_Localization_ZH_HANS;
  return (
    <Box m={0} p={1} height="100%" overflow="hidden">
      <Table
        columns={columns}
        data={data}
        enableStickyHeader
        enableSorting
        muiPaginationProps={{
          showRowsPerPage: false,
          size: 'small',
        }}
        paginationDisplayMode="pages"
        muiTableContainerProps={{ sx: { maxHeight: '286px' } }}
        localization={localization}
      />
    </Box>
  );
});
