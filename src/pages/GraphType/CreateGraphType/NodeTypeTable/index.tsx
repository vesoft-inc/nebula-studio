import { Box, Button, Typography } from '@mui/material';
import { AddFilled } from '@vesoft-inc/icons';
import { useTranslation } from 'react-i18next';
import { Table } from '@vesoft-inc/ui-components';
import { observer } from 'mobx-react-lite';
import { type MRT_ColumnDef } from 'material-react-table';

import { ActionContainer } from './styles';
import CreateNodeTypeModal from '../CreateNodeTypeModal';
import { useModal, useStore } from '@/stores';
import { INodeTypeItem, IProperty } from '@/interfaces';
import { useCallback, useMemo } from 'react';
import { useTheme } from '@emotion/react';

function NodeTypeTable() {
  const { schemaStore } = useStore().graphtypeStore;
  const dataSource = schemaStore?.nodeTypeList || [];

  const columns = useMemo<MRT_ColumnDef<INodeTypeItem>[]>(
    () => [
      {
        accessorKey: 'name', //access nested data with dot notation
        header: 'Node Type',
        // size: 150,
      },
      {
        accessorKey: 'primaryKey',
        header: 'Primary Key',
        // size: 150,
      },
      {
        accessorKey: 'labels', //normal accessorKey
        header: 'Labels',
        // size: 200,
      },
      {
        header: 'Operation',
        // size: 200,
      },
    ],
    []
  );

  const getSubColumns = useCallback(
    (num: number) =>
      [
        {
          accessorKey: 'name', //access nested data with dot notation
          header: 'Property Name',
          Header: ({ column }) => (
            <Typography>
              {column.columnDef.header} ({num})
            </Typography>
          ),
        },
        {
          accessorKey: 'type',
          header: 'Property Type',
          Header: ({ column }) => <Typography>{column.columnDef.header}</Typography>,
        },
      ] as MRT_ColumnDef<IProperty>[],
    []
  );

  const { t } = useTranslation(['graphtype']);
  const modal = useModal();

  const handleCreateNodeType = () => {
    modal.show({
      title: t('createNodeType', { ns: 'graphtype' }),
      content: <CreateNodeTypeModal />,
    });
  };

  const theme = useTheme();

  return (
    <>
      <ActionContainer>
        <Button onClick={handleCreateNodeType} variant="outlined" startIcon={<AddFilled />}>
          {t('createGraphType', { ns: 'graphtype' })}
        </Button>
      </ActionContainer>
      <Box mt={2}>
        <Table
          columns={columns}
          data={dataSource}
          // enableExpandAll={false}
          renderDetailPanel={({ row }) => {
            const { properties } = row.original;
            return (
              <Table
                columns={getSubColumns(properties.length)}
                data={properties}
                enablePagination={false}
                enableBottomToolbar={false}
                muiTableHeadCellProps={{
                  sx: {
                    height: '30px',
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingLeft: theme.spacing(2),
                  },
                }}
                muiTableBodyCellProps={{
                  sx: {
                    height: '30px',
                    padding: 0,
                    paddingLeft: theme.spacing(2),
                  },
                }}
                muiTableProps={{
                  sx: {
                    backgroundColor: theme.palette.vesoft.bgColor1,
                  },
                }}
                muiTablePaperProps={{
                  sx: {
                    border: 'none',
                    boxShadow: 'none',
                  },
                }}
              />
            );
          }}
          // muiExpandButtonProps={({ row, table }) => ({
          //   onClick: () => table.setExpanded({ [row.id]: !row.getIsExpanded() }), //set only this row to be expanded
          // })}
        />
      </Box>
    </>
  );
}

export default observer(NodeTypeTable);
