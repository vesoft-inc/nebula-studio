import { Box, Button } from '@mui/material';
import { AddFilled } from '@vesoft-inc/icons';
import { useTranslation } from 'react-i18next';
import { Table } from '@vesoft-inc/ui-components';

import { ActionContainer } from './styles';
import { observer } from 'mobx-react-lite';
import { useModal, useStore } from '@/stores';
import CreateNodeTypeModal from '../CreateNodeTypeModal';

function NodeTypeTable() {
  const { graphtypeStore } = useStore();
  const { schemaStore } = graphtypeStore;
  const columns = [
    {
      accessorKey: 'types', //access nested data with dot notation
      header: 'Node Type',
      size: 150,
    },
    {
      accessorKey: 'primary_keys',
      header: 'Primary Key',
      size: 150,
    },
    {
      accessorKey: 'labels', //normal accessorKey
      header: 'Labels',
      size: 200,
    },
    {
      header: 'Operation',
      size: 200,
    },
  ];

  const { t } = useTranslation(['graphtype']);
  const modal = useModal();

  const handleCreateNodeType = () => {
    modal.show({
      title: 'Create Node Type',
      content: <CreateNodeTypeModal />,
    });
  };

  return (
    <>
      <ActionContainer>
        <Button onClick={handleCreateNodeType} variant="outlined" startIcon={<AddFilled />}>
          {t('createGraphType', { ns: 'graphtype' })}
        </Button>
      </ActionContainer>
      <Box mt={2}>
        <Table columns={columns} data={schemaStore?.nodeTypeList || []} />
      </Box>
    </>
  );
}

export default observer(NodeTypeTable);
