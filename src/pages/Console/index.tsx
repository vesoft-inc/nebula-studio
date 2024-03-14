import { Fragment, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';
import { VectorTriangle, FileDocument, Play, QueryTemplate, RestoreFilled, DeleteOutline } from '@vesoft-inc/icons';
import { IMenuRouteItem, Menu } from '@vesoft-inc/ui-components';
import { execGql } from '@/services';
import { useStore } from '@/stores';
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

export default observer(function Console() {
  const theme = useTheme();
  const { consoleStore } = useStore();
  const { t } = useTranslation(['console', 'common']);
  const [activeMenu, setActiveMenu] = useState('Schema');
  const activeIcon = activeMenu === 'Schema' ? <VectorTriangle /> : <FileDocument />;

  const handleMenuClick = useCallback((menuItem: IMenuRouteItem) => {
    setActiveMenu(menuItem.key);
  }, []);

  const handleRunGql = useCallback(() => {
    execGql(
      'CALL show_graphs() YIELD `graph_name` AS gn CALL describe_graph(gn) YIELD `graph_type_name` AS gtn return gn, gtn'
    ).then((r) => {
      console.log('=====r', r);
    });
  }, []);

  useEffect(() => {
    consoleStore.getGraphTypes();
  }, []);

  const groups = Object.groupBy(consoleStore.graphTypeElements || [], (ele) => ele.name);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      <StyledSider>
        <SiderItem sx={{ width: (theme) => theme.spacing(8) }}>
          <Menu
            canToggle={false}
            items={[
              {
                key: 'Schema',
                label: 'Schema',
                icon: <VectorTriangle fontSize="medium" />,
              },
              {
                key: 'Template',
                label: 'Template',
                icon: <FileDocument fontSize="medium" />,
              },
            ]}
            selectedKeys={activeMenu ? [activeMenu] : []}
            onMenuClick={handleMenuClick}
            activeSlotProps={{
              menuListItemButton: {
                sx: {
                  backgroundColor: theme.palette.vesoft.themeColor1,
                  height: theme.spacing(8),
                  borderRadius: 0,
                  '&:hover': {
                    borderRadius: 0,
                    backgroundColor: theme.palette.vesoft.themeColor1,
                  },
                },
              },
              menuItemIcon: {
                sx: {
                  color: theme.palette.vesoft.textColor8,
                },
              },
            }}
            slotProps={{
              drawer: {
                variant: 'permanent',
                PaperProps: {
                  sx: {
                    borderRight: 'none',
                    display: 'block',
                    backgroundColor: 'inherit',
                  },
                },
                sx: {
                  width: theme.spacing(8),
                },
              },
              menuListItemButton: {
                sx: {
                  height: theme.spacing(8),
                  '&:hover': {
                    borderRadius: 0,
                    backgroundColor: theme.palette.vesoft.themeColor1,
                  },
                },
              },
              menuItemIcon: {
                sx: {
                  color: theme.palette.vesoft.textColor1,
                },
              },
            }}
          />
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
            <Suspense>
              <MonacoEditor themeMode={theme.palette.mode} />
            </Suspense>
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
