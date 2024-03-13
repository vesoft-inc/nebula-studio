import isPropValid from '@emotion/is-prop-valid';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { BoxProps } from '@mui/system';

export const SchemaConfigContainer = styled(Box, {
  shouldForwardProp: (prop: string) => isPropValid(prop) || prop === 'variant',
})<BoxProps & { open?: boolean }>(({ theme, open }) => ({
  width: '350px',
  position: 'absolute',
  whiteSpace: 'nowrap',
  height: `calc(100% - ${theme.spacing(4)}px)`,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  border: `1px solid ${theme.palette.vesoft.bgColor11}`,
  borderRadius: 6,
  right: theme.spacing(2),
  top: theme.spacing(2),
  bottom: theme.spacing(2),
  // padding: '10px 20px',
  backgroundColor: theme.palette.vesoft.bgColor,
  ...(!open && {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: 0,
    overflowX: 'hidden',
    // padding: 0,
    border: 'none',
  }),
}));

export const ActionsContainer = styled(Box)`
  height: 64px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.vesoft.bgColor11};
  display: flex;
  align-items: center;
  padding: 10px 16px;
`;

export const NodeTypeInfoContainer = styled(Box)`
  padding: 10px 16px;
`;
