import { Fragment, Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';
import { VectorTriangle, FileDocument, Play, QueryTemplate, RestoreFilled, DeleteOutline } from '@vesoft-inc/icons';
import { execGql } from '@/services';
import { useStore } from '@/stores';
import SiderMenu from '@/components/SiderMenu';
import { OutputBox } from './OutputBox';
import SchemaItem from './SchemaItem';
import {
  ActionWrapper,
  EditorWrapper,
  InputArea,
  SiderItem,
  SiderItemHeader,
  StyledSider,
  StyledIconButton,
  RunButton,
} from './styles';

const MonacoEditor = lazy(() => import('@/components/MonacoEditor'));

const ConsoleEditor = observer(function ConsoleEditor() {
  const theme = useTheme();
  const { consoleStore } = useStore();
  const { editorValue, updateEditorValue } = consoleStore;
  return (
    <Suspense>
      <MonacoEditor themeMode={theme.palette.mode} value={editorValue} onChange={updateEditorValue} />
    </Suspense>
  );
});

export default observer(function Console() {
  const { consoleStore } = useStore();
  const { t } = useTranslation(['console', 'common']);
  const [activeMenu, setActiveMenu] = useState('Schema');
  const siderItems = useMemo(
    () => [
      {
        key: 'Schema',
        label: 'Schema',
        icon: <VectorTriangle fontSize="medium" />,
        sx: { height: 60 },
      },
      {
        key: 'Template',
        label: 'Template',
        icon: <FileDocument fontSize="medium" />,
        sx: { height: 60 },
      },
    ],
    []
  );

  const handleRunGql = useCallback(() => {
    // CALL show_graphs() YIELD `graph_name` AS gn CALL describe_graph(gn) YIELD `graph_type_name` AS gtn return gn, gtn
    const gql = consoleStore.editorValue;
    execGql(gql).then((r) => {
      console.log('=====r', r);
    });
  }, [consoleStore]);

  useEffect(() => {
    consoleStore.getGraphTypes();
  }, []);

  const activeIcon = activeMenu === 'Schema' ? <VectorTriangle /> : <FileDocument />;
  const groups = Object.groupBy(consoleStore.graphTypeElements || [], (ele) => ele.name);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      <StyledSider>
        <SiderItem sx={{ width: (theme) => theme.spacing(8) }}>
          <SiderMenu items={siderItems} onMenuClick={setActiveMenu} activeKey={activeMenu} />
        </SiderItem>
        <SiderItem sx={{ width: (theme) => theme.spacing(36) }}>
          <SiderItemHeader>
            {activeIcon}
            <Box component="span" sx={{ marginLeft: '10px' }}>
              {activeMenu}
            </Box>
          </SiderItemHeader>
          <List sx={{ width: '100%', overflowY: 'auto', paddingTop: 0 }} component="nav">
            {Object.entries(groups).map(([name, elements]) => (
              <Fragment key={name}>
                <SchemaItem name={name} elements={elements || []} />
                <Divider />
              </Fragment>
            ))}
          </List>
        </SiderItem>
      </StyledSider>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <InputArea>
          <ActionWrapper sx={{ height: (theme) => theme.spacing(8) }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
                <StyledIconButton aria-label="template">
                  <QueryTemplate fontSize="medium" />
                </StyledIconButton>
                <StyledIconButton aria-label="restore">
                  <RestoreFilled fontSize="medium" />
                </StyledIconButton>
                <StyledIconButton aria-label="delete">
                  <DeleteOutline fontSize="medium" />
                </StyledIconButton>
              </Stack>
              <RunButton variant="contained" disableElevation startIcon={<Play />} onClick={handleRunGql}>
                {t('run', { ns: 'console' })}
              </RunButton>
            </Box>
          </ActionWrapper>
          <EditorWrapper>
            <ConsoleEditor />
          </EditorWrapper>
          <ActionWrapper sx={{ height: (theme) => theme.spacing(4), fontSize: (theme) => theme.typography.fontSize }}>
            <Box sx={{ flexGrow: 1 }}></Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ marginRight: 1 }}>Console</Box>
              <Box sx={{ marginRight: 1 }}>Templates</Box>
            </Box>
          </ActionWrapper>
        </InputArea>
        <Box>
          <OutputBox />
        </Box>
      </Box>
    </Box>
  );
});
