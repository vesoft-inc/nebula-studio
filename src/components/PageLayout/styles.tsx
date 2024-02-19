import { Box, BoxProps, styled } from '@mui/material';
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
  background-color: ${({ theme }) =>
    theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900]};
  color: ${({ theme }) => theme.palette.text.primary};
`;

export const MainContentContainer = styled(Box)<BoxProps>(({ theme }) => ({
  component: 'main',
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
  flexGrow: 1,
  height: `calc(100vh - ${AppBarHeight}px)`,
  overflow: 'auto',
}));
