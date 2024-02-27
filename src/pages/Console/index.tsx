import { Suspense, lazy, useCallback, useState } from 'react';
import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import MenuList from '@mui/material/MenuList';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import { VectorTriangle, FileDocument, Play, ChevronRightFilled, DotsHexagon, EdgeType } from '@vesoft-inc/icons';
import { styled } from '@mui/material/styles';
import type { SxProps } from '@mui/material';
import {
  ActionWrapper,
  EditorWrapper,
  InputArea,
  SiderItem,
  SiderItemHeader,
  StyledMenuItem,
  StyledSider,
} from './styles';

const MonacoEditor = lazy(() => import('@/components/MonacoEditor'));

const StyledListItemIcon = styled(ListItemIcon)`
  min-width: auto;
  margin: ${({ theme }) => theme.spacing(0, 1.5, 0, 1)};
`;

export default function Console() {
  const theme = useTheme();
  const [activeMenu, setActive] = useState('Console');
  const [open, setOpen] = useState(true);

  const handleClick = useCallback(() => setOpen((open) => !open), []);
  const activeIcon = activeMenu === 'Console' ? <VectorTriangle /> : <FileDocument />;
  const schemaTextSx: SxProps = { color: theme.palette.vesoft?.textColor1, fontWeight: 600, fontSize: '16px' };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      <StyledSider>
        <SiderItem sx={{ width: (theme) => theme.spacing(8) }}>
          <MenuList sx={{ padding: 0 }}>
            <StyledMenuItem value="Console" selected={'Console' === activeMenu} onClick={() => setActive('Console')}>
              <VectorTriangle />
            </StyledMenuItem>
            <StyledMenuItem
              value="Templates"
              selected={'Templates' === activeMenu}
              onClick={() => setActive('Templates')}
            >
              <FileDocument />
            </StyledMenuItem>
          </MenuList>
        </SiderItem>
        <SiderItem sx={{ width: (theme) => theme.spacing(36) }}>
          <SiderItemHeader>
            {activeIcon}
            <Box component="span" sx={{ marginLeft: '10px' }}>
              {activeMenu}
            </Box>
          </SiderItemHeader>
          <List
            sx={{ width: '100%' }}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
              <ListSubheader
                component="div"
                id="nested-list-subheader"
                sx={{ bgcolor: (theme) => theme.palette.vesoft.bgColor2 }}
              >
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
      <Box sx={{ flex: 1 }}>
        <InputArea>
          <ActionWrapper sx={{ height: (theme) => theme.spacing(8) }}>
            <FormControl sx={{ width: 200 }} size="small">
              <InputLabel id="console-space-select-label">Age</InputLabel>
              <Select labelId="console-space-select-label" id="console-space-select" label="Age" size="small" value="">
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                disableElevation
                startIcon={<Play />}
                sx={{
                  backgroundColor: (theme) => theme.palette.vesoft.themeColor1,
                  color: (theme) => theme.palette.vesoft.textColor8,
                }}
              >
                RUN
              </Button>
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
      </Box>
    </Box>
  );
}
