import { observer } from 'mobx-react-lite';
import { Button, Typography } from '@mui/material';
import { ContentCopyFilled, DeleteOutline } from '@vesoft-inc/icons';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { UseFormReturn, useForm, useWatch } from 'react-hook-form-mui';

import { ActionsContainer, SchemaDrawerontainer } from './styles';
import { useStore } from '@/stores';
import NodeTypeConfigForm from '@/pages/GraphType/GraphTypeBuilder/NodeType/NodeTypeConfigForm';
import EdgeTypeConfigForm from '@/pages/GraphType/GraphTypeBuilder/EdgeType/EdgeTypeConfigForm';
import { IEdgeTypeItem, INodeTypeItem } from '@/interfaces';
import { VisualEditorType } from '@/utils/constant';
import { useEffect } from 'react';

function ConfigDrawer() {
  const { graphtypeStore } = useStore();
  const { schemaStore } = graphtypeStore;
  const open = Boolean(schemaStore?.activeItem);
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);

  const getDefaultValues = (): INodeTypeItem | IEdgeTypeItem | undefined => {
    if (!schemaStore?.activeItem) return;
    if (schemaStore?.activeItem?.type === VisualEditorType.Tag) {
      const nodeItem = new INodeTypeItem(schemaStore.activeItem.value);
      return nodeItem;
    } else if (schemaStore?.activeItem?.type === VisualEditorType.Edge) {
      const edgeItem = new IEdgeTypeItem(schemaStore.activeItem.value);
      return edgeItem;
    }
    return undefined;
  };

  const form = useForm<INodeTypeItem | IEdgeTypeItem>({
    defaultValues: getDefaultValues(),
  });

  const values = useWatch({
    control: form.control,
  });

  useEffect(() => {
    if (values) {
      updateItemInfo(values as INodeTypeItem | IEdgeTypeItem);
    }
  }, [values]);

  useEffect(() => {
    if (open === true) {
      form.reset(getDefaultValues());
    } else {
      form.reset(new INodeTypeItem());
    }
  }, [schemaStore?.activeItem?.value?.id, open]);

  const updateItemInfo = (values: INodeTypeItem | IEdgeTypeItem) => {
    if (schemaStore?.activeItem?.type === VisualEditorType.Tag) {
      schemaStore?.setActiveItem({
        type: VisualEditorType.Tag,
        value: {
          ...values,
          id: schemaStore?.activeItem?.value.id,
        } as INodeTypeItem,
      });
    }
    if (schemaStore?.activeItem?.type === VisualEditorType.Edge) {
      schemaStore?.setActiveItem({
        type: VisualEditorType.Edge,
        value: {
          ...values,
          id: schemaStore?.activeItem?.value.id,
        } as IEdgeTypeItem,
      });
    }
  };

  return (
    <SchemaDrawerontainer sx={{ width: '450px' }} variant="persistent" open={open} anchor="right">
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
        {schemaStore?.activeItem?.type === VisualEditorType.Tag && (
          <NodeTypeConfigForm form={form as UseFormReturn<INodeTypeItem>} colorPicker />
        )}
        {schemaStore?.activeItem?.type === VisualEditorType.Edge && (
          <EdgeTypeConfigForm form={form as UseFormReturn<IEdgeTypeItem>} colorPicker hasSrcAndDstNode />
        )}
      </>
    </SchemaDrawerontainer>
  );
}

export default observer(ConfigDrawer);
