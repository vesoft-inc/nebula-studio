import { observer } from 'mobx-react-lite';
import { Button, Typography } from '@mui/material';
import { ContentCopyFilled, DeleteOutline } from '@vesoft-inc/icons';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { Form } from '@vesoft-inc/ui-components';

import { ActionsContainer, NodeTypeInfoContainer, SchemaConfigContainer } from './styles';
import { useStore } from '@/stores';

// interface ConfigDrawerProps extends DrawerProps {
//   // anchor: HTMLDivElement;
// }

function ConfigDrawer() {
  const { graphtypeStore } = useStore();
  const { schemaStore } = graphtypeStore;
  const open = Boolean(schemaStore?.activeItem);
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);
  const form = Form.useForm({
    defaultValues: {
      name: '',
      // label
    },
  });

  return (
    <SchemaConfigContainer open={open}>
      {open && (
        <>
          <ActionsContainer>
            <Button variant="outlined" color="primary" startIcon={<ContentCopyFilled fontSize="medium" />}>
              <Typography color="primary">{t('duplicate', { ns: 'graphtype' })}</Typography>
            </Button>
            <Button
              variant="outlined"
              color="error"
              sx={{ marginLeft: theme.spacing(1) }}
              startIcon={<DeleteOutline color="error" fontSize="medium" />}
            >
              <Typography color="error">{t('delete', { ns: 'graphtype' })}</Typography>
            </Button>
          </ActionsContainer>
          <NodeTypeInfoContainer>
            <Typography>{t('nodeType', { ns: 'graphtype' })}</Typography>
            <Form form={form}></Form>
          </NodeTypeInfoContainer>
        </>
      )}
    </SchemaConfigContainer>
  );
}

export default observer(ConfigDrawer);
