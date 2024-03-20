import { observer } from 'mobx-react-lite';
import { Button, Typography } from '@mui/material';
import { ContentCopyFilled, DeleteOutline } from '@vesoft-inc/icons';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form-mui';

import { ActionsContainer, SchemaDrawerontainer } from './styles';
import { useStore } from '@/stores';
import NodeTypeConfigForm from '@/pages/GraphType/CreateGraphType/NodeTypeConfigForm';
import { INodeTypeItem, IProperty } from '@/interfaces';
import { PropertyDataType } from '@/utils/constant';

function ConfigDrawer() {
  const { graphtypeStore } = useStore();
  const { schemaStore } = graphtypeStore;
  const open = Boolean(schemaStore?.activeItem);
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);
  const form = useForm<INodeTypeItem>({
    defaultValues: {
      properties: [
        new IProperty({
          name: '',
          type: PropertyDataType.STRING,
        }),
      ],
    },
  });
  return (
    <SchemaDrawerontainer sx={{ width: '350px' }} variant="persistent" open={open} anchor="right">
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
        <NodeTypeConfigForm form={form} />
      </>
    </SchemaDrawerontainer>
  );
}

export default observer(ConfigDrawer);
