import Box, { type BoxProps } from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { AppBarHeight } from '@/components/PageHeader/styles';

export const MainContentContainer = styled(Box)<BoxProps>(({ theme }) => ({
  component: 'main',
  backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
  flexGrow: 1,
  height: `calc(100vh - ${AppBarHeight}px)`,
  overflow: 'auto',
}));
