import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import { AddFilled, ArrowBackFilled, ArrowForwardFilled, Delete, EditFilled, Minus } from '@vesoft-inc/icons';
import { useTranslation } from 'react-i18next';
import { Table } from '@vesoft-inc/ui-components';
import { observer } from 'mobx-react-lite';
import { type MRT_ColumnDef } from 'material-react-table';

import { ActionContainer } from './styles';
import { useStore } from '@/stores';
import { IEdgeTypeItem, IProperty } from '@/interfaces';
import { useCallback, useState } from 'react';
import { useTheme } from '@emotion/react';
import { getLabelColor } from '@/utils';
import EdgeTypeConfigModal from './EdgeTypeConfigModal';
import { EdgeDirectionType } from '@/utils/constant';

interface EdgeTypeTableProps {
  readonly?: boolean;
}

function EdgeTypeTable(props: EdgeTypeTableProps) {
  const { readonly } = props;
  const { schemaStore } = useStore().graphtypeStore;
  const dataSource = schemaStore?.edgeTypeList || [];
  const { t } = useTranslation(['graphtype']);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEdgeType, setEditEdgeType] = useState<IEdgeTypeItem | undefined>();

  const handleEditEdgeType = (edgeType: IEdgeTypeItem) => () => {
    setEditEdgeType(edgeType);
    setModalOpen(true);
  };

  const handleDeleteEdgeType = (edgeType: IEdgeTypeItem) => () => {
    schemaStore?.deleteEdgeType(edgeType);
  };

  const getColumns = useCallback((): MRT_ColumnDef<IEdgeTypeItem>[] => {
    const columns: MRT_ColumnDef<IEdgeTypeItem>[] = [
      {
        accessorKey: 'name', //access nested data with dot notation
        header: t('edgeTypeName', { ns: 'graphtype' }),
      },
      {
        header: t('relation', { ns: 'graphtype' }),
        Cell: ({ row }) => (
          <Stack direction="row" spacing={2} display="flex" alignItems="center">
            <Typography>{row.original.srcNode.name}</Typography>
            <Typography display="flex" alignItems="center">
              {row.original.direction === EdgeDirectionType.Forward && <ArrowForwardFilled />}
              {row.original.direction === EdgeDirectionType.Backword && <ArrowBackFilled />}
              {row.original.direction === EdgeDirectionType.Undirected && <Minus />}
            </Typography>
            <Typography>{row.original.dstNode.name}</Typography>
          </Stack>
        ),
      },
      {
        accessorKey: 'labels', //normal accessorKey
        header: t('labels', { ns: 'graphtype' }),
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
        header: t('primaryKey', { ns: 'graphtype' }),
        Cell: ({ row }) =>
          row.original.properties
            .filter((property) => property.isPrimaryKey)
            .map((property, index) => (
              <Chip sx={{ minWidth: 40, '&:not(:first-of-type)': { ml: 1 } }} key={index} label={property.name} />
            )),
      },
    ];
    if (!readonly) {
      columns.push({
        header: t('operation', { ns: 'graphtype' }),
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
      });
    }
    return columns;
  }, [readonly]);

  const getSubColumns = useCallback(
    (num: number) =>
      [
        {
          accessorKey: 'name', //access nested data with dot notation
          header: t('propertyName', { ns: 'graphtype' }),
          Header: ({ column }) => (
            <Typography>
              {column.columnDef.header} ({num})
            </Typography>
          ),
        },
        {
          accessorKey: 'type',
          header: t('propertyType', { ns: 'graphtype' }),
          Header: ({ column }) => <Typography>{column.columnDef.header}</Typography>,
        },
      ] as MRT_ColumnDef<IProperty>[],
    []
  );

  const handleCreateEdgeType = () => {
    setEditEdgeType(undefined);
    setModalOpen(true);
  };

  const theme = useTheme();

  return (
    <>
      {!readonly && (
        <ActionContainer>
          <Button onClick={handleCreateEdgeType} variant="outlined" startIcon={<AddFilled />}>
            {t('createEdgeType', { ns: 'graphtype' })}
          </Button>
        </ActionContainer>
      )}
      <Box mt={2}>
        <Table
          columns={getColumns()}
          data={dataSource.slice()}
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
      <EdgeTypeConfigModal open={modalOpen} onCancel={() => setModalOpen(false)} edgeTypeItem={editEdgeType} />
    </>
  );
}

export default observer(EdgeTypeTable);
