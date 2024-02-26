import { Suspense, lazy, useState } from 'react';
import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import MenuList from '@mui/material/MenuList';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import { VectorTriangle, FileDocument, Play } from '@vesoft-inc/icons';
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

export default function Console() {
  const theme = useTheme();
  const [activeMenu, setActive] = useState('Console');
  const activeIcon = activeMenu === 'Console' ? <VectorTriangle /> : <FileDocument />;
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
