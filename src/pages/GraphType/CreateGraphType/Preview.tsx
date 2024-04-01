import { observer } from 'mobx-react-lite';
import { EditorWrapper, StepContainer, schemaTextSx } from './styles';
import { PropsWithChildren, useCallback, useState } from 'react';
import { Box, Collapse, List, ListItem, ListItemText } from '@mui/material';
import { ChevronRightFilled } from '@vesoft-inc/icons';
import NodeTypeTable from './NodeType';
import EdgeTypeTable from './EdgeType';
import { useTranslation } from 'react-i18next';
import GQLEditorLite from '@/components/GQLEditorLite';

interface CollapseItemProps extends PropsWithChildren {
  title: string;
}

function CollapseItem(props: CollapseItemProps) {
  const { title } = props;
  const [open, setOpen] = useState(true);
  const handleClick = useCallback(() => setOpen((open) => !open), []);
  return (
    <Box sx={{ '&:not(:first-of-type)': { mt: 2 } }}>
      <ListItem onClick={handleClick} sx={{ pl: 0, '&:hover': { cursor: 'pointer' } }}>
        <ChevronRightFilled
          sx={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform ease 0.25s', mr: 1 }}
        />
        <ListItemText primaryTypographyProps={{ sx: schemaTextSx, title: title }} primary={title} />
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {props.children}
      </Collapse>
    </Box>
  );
}

interface PreviewProps {
  ngql: string;
}

function Preview(props: PreviewProps) {
  const { ngql } = props;
  const { t } = useTranslation(['graphtype']);
  return (
    <StepContainer>
      <List sx={{ width: '100%', paddingTop: 0 }} component="nav">
        <CollapseItem title={t('graphTypeDDL', { ns: 'graphtype' })}>
          <EditorWrapper>
            <GQLEditorLite value={ngql} readOnly />
          </EditorWrapper>
        </CollapseItem>
        <CollapseItem title={t('nodeType', { ns: 'graphtype' })}>
          <NodeTypeTable readonly />
        </CollapseItem>
        <CollapseItem title={t('edgeType', { ns: 'graphtype' })}>
          <EdgeTypeTable readonly />
        </CollapseItem>
      </List>
    </StepContainer>
  );
}

export default observer(Preview);
