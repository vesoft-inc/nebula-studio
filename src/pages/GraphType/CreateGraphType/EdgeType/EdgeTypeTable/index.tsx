import { Box, Button, Chip, IconButton, Typography } from '@mui/material';
import { AddFilled, Delete, EditFilled } from '@vesoft-inc/icons';
import { useTranslation } from 'react-i18next';
import { Table } from '@vesoft-inc/ui-components';
import { observer } from 'mobx-react-lite';
import { type MRT_ColumnDef } from 'material-react-table';

import { ActionContainer } from './styles';
// import EdgeTypeConfigModal from '../EdgeTypeConfigModal';
import { useModal, useStore } from '@/stores';
import { IEdgeTypeItem, IProperty } from '@/interfaces';
import { useCallback, useMemo } from 'react';
import { useTheme } from '@emotion/react';
import { getLabelColor } from '@/utils';
import EdgeTypeConfigModal from '../EdgeTypeConfigModal';

function EdgeTypeTable() {
  const { schemaStore } = useStore().graphtypeStore;
  const dataSource = schemaStore?.edgeTypeList || [];
  const { t } = useTranslation(['graphtype']);
  const modal = useModal();

  const handleEditEdgeType = (edgeType: IEdgeTypeItem) => () => {
    modal.show({
      title: t('editEdgeType', { ns: 'graphtype' }),
      content: <EdgeTypeConfigModal edgeTypeItem={edgeType} />,
    });
  };

  const handleDeleteEdgeType = (edgeType: IEdgeTypeItem) => () => {
    schemaStore?.deleteEdgeType(edgeType.id);
  };

  const columns = useMemo<MRT_ColumnDef<IEdgeTypeItem>[]>(
    () => [
      {
        accessorKey: 'name', //access nested data with dot notation
        header: 'Edge Type Name',
      },
      {
        header: 'Relation',
      },
      {
        accessorKey: 'labels', //normal accessorKey
        header: 'Labels',
        Cell: ({ row }) =>
          row.original.labels.map((label, index) => {
            const [color, backgroundColor] = getLabelColor(index, theme);
            return (
              <Chip
                sx={{
                  borderColor: color,
                  backgroundColor,
                  color,
                  minWidth: 40,
                  '&:not(:first-of-type)': { ml: 1 },
                }}
                key={index}
                label={label}
                variant="outlined"
              />
            );
          }),
      },
      {
        accessorKey: 'primaryKeys',
        header: 'Primary Key',
        Cell: ({ row }) =>
          row.original.properties
            .filter((property) => property.isPrimaryKey)
            .map((property, index) => (
              <Chip sx={{ minWidth: 40, '&:not(:first-of-type)': { ml: 1 } }} key={index} label={property.name} />
            )),
      },
      {
        header: 'Operation',
        Cell: ({ row }) => (
          <Box display="flex" alignItems="center">
            <IconButton size="small" onClick={handleEditEdgeType(row.original)}>
              <EditFilled />
            </IconButton>
            <IconButton size="small" onClick={handleDeleteEdgeType(row.original)} sx={{ marginLeft: 2 }}>
              <Delete />
            </IconButton>
          </Box>
        ),
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

  const handleCreateEdgeType = () => {
    modal.show({
      title: t('createEdgeType', { ns: 'graphtype' }),
      content: <EdgeTypeConfigModal />,
    });
  };

  const theme = useTheme();

  return (
    <>
      <ActionContainer>
        <Button onClick={handleCreateEdgeType} variant="outlined" startIcon={<AddFilled />}>
          {t('createEdgeType', { ns: 'graphtype' })}
        </Button>
      </ActionContainer>
      <Box mt={2}>
        <Table
          columns={columns}
          data={dataSource}
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
                    height: '35px',
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingLeft: theme.spacing(2),
                  },
                }}
                muiTableBodyCellProps={{
                  sx: {
                    height: '35px',
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
        />
      </Box>
    </>
  );
}

export default observer(EdgeTypeTable);
