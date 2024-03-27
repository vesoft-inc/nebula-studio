import { observer } from 'mobx-react-lite';
import { Button, Typography } from '@mui/material';
import { ContentCopyFilled, DeleteOutline } from '@vesoft-inc/icons';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { UseFormReturn, useForm, useWatch } from 'react-hook-form-mui';

import { ActionsContainer, SchemaDrawerontainer } from './styles';
import { useStore } from '@/stores';
import NodeTypeConfigForm from '@/pages/GraphType/CreateGraphType/NodeType/NodeTypeConfigForm';
import EdgeTypeConfigForm from '@/pages/GraphType/CreateGraphType/EdgeType/EdgeTypeConfigForm';
import { IEdgeTypeItem, INodeTypeItem } from '@/interfaces';
import { VisualEditorType } from '@/utils/constant';
import { useEffect, useRef } from 'react';

function ConfigDrawer() {
  const { graphtypeStore } = useStore();
  const { schemaStore } = graphtypeStore;
  const open = Boolean(schemaStore?.activeItem);
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);

  const getActiveItemType = (item?: INodeTypeItem | IEdgeTypeItem) => {
    if (item instanceof INodeTypeItem) {
      return VisualEditorType.Tag;
    } else if (item instanceof IEdgeTypeItem) {
      return VisualEditorType.Edge;
    }
    return undefined;
  };

  const activeItemTypeRef = useRef<VisualEditorType | undefined>(getActiveItemType(schemaStore?.activeItem));
  const activeItemRef = useRef<INodeTypeItem | IEdgeTypeItem | undefined>();

  const getDefaultValues = (): INodeTypeItem | IEdgeTypeItem | undefined => {
    if (activeItemTypeRef.current === VisualEditorType.Tag) {
      return new INodeTypeItem(schemaStore?.activeItem);
    } else if (activeItemTypeRef.current === VisualEditorType.Edge) {
      return new IEdgeTypeItem(schemaStore?.activeItem);
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
      if (schemaStore?.activeItem?.id) {
        updateItemInfo(
          schemaStore?.activeItem?.id,
          values as INodeTypeItem | IEdgeTypeItem,
          getActiveItemType(schemaStore?.activeItem)
        );
      }
    }
  }, [values]);

  useEffect(() => {
    if (open === true) {
      reset();
      activeItemTypeRef.current = getActiveItemType(schemaStore?.activeItem);
      activeItemRef.current = schemaStore?.activeItem;
      form.reset(getDefaultValues());
    }
  }, [schemaStore?.activeItem, open]);

  const reset = () => {
    form.reset();
    activeItemTypeRef.current = undefined;
    activeItemRef.current = undefined;
  };

  const updateItemInfo = (id: string, values: INodeTypeItem | IEdgeTypeItem, activeItemType?: VisualEditorType) => {
    if (!id) return;
    if (activeItemType === VisualEditorType.Tag) {
      schemaStore?.updateNodeType(id, values as INodeTypeItem);
    } else if (activeItemType === VisualEditorType.Edge) {
      schemaStore?.updateEdgeType(id, values as IEdgeTypeItem);
    }
    schemaStore?.editor?.graph.update();
  };

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
        {activeItemTypeRef.current === VisualEditorType.Tag && (
          <NodeTypeConfigForm form={form as UseFormReturn<INodeTypeItem>} />
        )}
        {activeItemTypeRef.current === VisualEditorType.Edge && (
          <EdgeTypeConfigForm form={form as UseFormReturn<IEdgeTypeItem>} />
        )}
      </>
    </SchemaDrawerontainer>
  );
}

export default observer(ConfigDrawer);
