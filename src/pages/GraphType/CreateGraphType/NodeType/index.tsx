import { Box, Button, Chip, IconButton, Typography } from '@mui/material';
import { AddFilled, Delete, EditFilled } from '@vesoft-inc/icons';
import { useTranslation } from 'react-i18next';
import { Table } from '@vesoft-inc/ui-components';
import { observer } from 'mobx-react-lite';
import { type MRT_ColumnDef } from 'material-react-table';

import { ActionContainer } from './styles';
import NodeTypeConfigModal from './NodeTypeConfigModal';
import { useStore } from '@/stores';
import { INodeTypeItem, IProperty } from '@/interfaces';
import { useCallback, useState } from 'react';
import { useTheme } from '@emotion/react';
import { getLabelColor } from '@/utils';

interface NodeTypeTableProps {
  readonly?: boolean;
}

function NodeTypeTable(props: NodeTypeTableProps) {
  const { readonly } = props;
  const { schemaStore } = useStore().graphtypeStore;
  const dataSource = schemaStore?.nodeTypeList || [];
  const { t } = useTranslation(['graphtype']);
  const [modalOpen, setModalOpen] = useState(false);
  const [editNodeType, setEditNodeType] = useState<INodeTypeItem | undefined>();

  const handleEditNodeType = (nodeType: INodeTypeItem) => () => {
    setEditNodeType(nodeType);
    setModalOpen(true);
  };

  const handleDeleteNodeType = (nodeType: INodeTypeItem) => () => {
    schemaStore?.deleteNodeType(nodeType);
  };

  const getColumns = useCallback((): MRT_ColumnDef<INodeTypeItem>[] => {
    const columns: MRT_ColumnDef<INodeTypeItem>[] = [
      {
        accessorKey: 'name', //access nested data with dot notation
        header: t('nodeTypeName', { ns: 'graphtype' }),
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
    ];
    if (!readonly) {
      columns.push({
        header: t('operation', { ns: 'graphtype' }),
        Cell: ({ row }) => (
          <Box display="flex" alignItems="center">
            <IconButton size="small" onClick={handleEditNodeType(row.original)}>
              <EditFilled />
            </IconButton>
            <IconButton size="small" onClick={handleDeleteNodeType(row.original)} sx={{ marginLeft: 2 }}>
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

  const handleCreateNodeType = () => {
    setEditNodeType(undefined);
    setModalOpen(true);
  };

  const theme = useTheme();

  return (
    <>
      {!readonly && (
        <ActionContainer>
          <Button onClick={handleCreateNodeType} variant="outlined" startIcon={<AddFilled />}>
            {t('createNodeType', { ns: 'graphtype' })}
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
      <NodeTypeConfigModal open={modalOpen} nodeTypeItem={editNodeType} onCancel={() => setModalOpen(false)} />
    </>
  );
}

export default observer(NodeTypeTable);
