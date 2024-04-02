import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { List } from '@mui/material';

import { EditorWrapper, StepContainer } from './styles';
import NodeTypeTable from './NodeType';
import EdgeTypeTable from './EdgeType';
import GQLEditorLite from '@/components/GQLEditorLite';
import CollapseItem from '@/components/CollapseItem';

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
