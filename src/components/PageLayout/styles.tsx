import Box, { type BoxProps } from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import styled from '@emotion/styled';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBarHeight = 64;

export const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>`
  position: relative;
  height: ${AppBarHeight}px;
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  color: ${({ theme }) => theme.palette.vesoft.textColor2};
`;

export const AppToolbar = styled(Toolbar)`
  padding-right: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
`;

export const MainContentContainer = styled(Box)<BoxProps>(({ theme }) => ({
  component: 'main',
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
  flexGrow: 1,
  height: `calc(100vh - ${AppBarHeight}px)`,
  overflow: 'auto',
}));
