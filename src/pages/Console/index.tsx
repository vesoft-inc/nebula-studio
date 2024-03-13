import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import type { SxProps } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  VectorTriangle,
  FileDocument,
  Play,
  ChevronRightFilled,
  DotsHexagon,
  EdgeType,
  QueryTemplate,
  RestoreFilled,
  DeleteOutline,
} from '@vesoft-inc/icons';
import { IMenuRouteItem, Menu } from '@vesoft-inc/ui-components';
import { execGql } from '@/services';
import { useStore } from '@/stores';
import { OutputBox } from './OutputBox';
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

const StyledListItemIcon = styled(ListItemIcon)`
  min-width: auto;
  margin: ${({ theme }) => theme.spacing(0, 1.5, 0, 1)};
`;

export default observer(function Console() {
  const theme = useTheme();
  const { consoleStore } = useStore();
  const { t } = useTranslation(['console', 'common']);
  const [activeMenu, setActiveMenu] = useState('console');
  const [open, setOpen] = useState(true);
  const handleClick = useCallback(() => setOpen((open) => !open), []);
  const activeIcon = activeMenu === 'console' ? <VectorTriangle /> : <FileDocument />;
  const schemaTextSx: SxProps = { color: theme.palette.vesoft?.textColor1, fontWeight: 600, fontSize: '16px' };

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      <StyledSider>
        <SiderItem sx={{ width: (theme) => theme.spacing(8) }}>
          <Menu
            canToggle={false}
            items={[
              {
                key: 'console',
                label: 'Console',
                icon: <VectorTriangle fontSize="medium" />,
              },
              {
                key: 'template',
                label: 'template',
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
          <List
            sx={{ width: '100%', overflowY: 'auto' }}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
              <ListSubheader component="div" id="nested-list-subheader">
                NebulaGraph Schema
              </ListSubheader>
            }
          >
            <Divider />
            <ListItemButton>
              <ChevronRightFilled />
              <StyledListItemIcon sx={schemaTextSx}>
                <DotsHexagon />
              </StyledListItemIcon>
              <ListItemText primaryTypographyProps={{ sx: schemaTextSx }} primary="Sent mail" />
            </ListItemButton>
            <Divider />
            <ListItemButton onClick={handleClick}>
              <ChevronRightFilled
                sx={{ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform ease 0.25s' }}
              />
              <StyledListItemIcon sx={schemaTextSx}>
                <DotsHexagon />
              </StyledListItemIcon>
              <ListItemText primaryTypographyProps={{ sx: schemaTextSx }} primary="Inbox" />
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Divider />
              <ListItem sx={{ pl: 6 }}>
                <ListItemText primary="Starred" />
              </ListItem>
              <Divider />
              <ListItem sx={{ pl: 6 }}>
                <ListItemText primary="Starred" />
              </ListItem>
            </Collapse>
            <Divider />
            <ListItemButton>
              <ChevronRightFilled />
              <StyledListItemIcon sx={schemaTextSx}>
                <EdgeType />
              </StyledListItemIcon>
              <ListItemText primaryTypographyProps={{ sx: schemaTextSx }} primary="Drafts" />
            </ListItemButton>
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
