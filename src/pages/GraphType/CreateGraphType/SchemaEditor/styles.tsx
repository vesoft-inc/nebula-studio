import { css } from '@emotion/css';
import isPropValid from '@emotion/is-prop-valid';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { BoxProps } from '@mui/system';

export const NodeTypeListContainer = styled(Box)`
  display: flex;
  height: 100%;
`;

export const CanvasContainer = styled(Box)`
  display: flex;
  flex: 1;
  height: 100%;
  margin-left: ${({ theme }) => theme.spacing(1)};
`;

export const TagsContainer = styled(Box)`
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
  padding: 20px 12px;
  height: 100%;
  width: 86px;
  border: 1px solid ${({ theme }) => theme.palette.vesoft.bgColor11};
  background: ${({ theme }) => theme.palette.vesoft.bgColor};
  border-radius: 6px;
`;

export const TagListContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const TagItem = styled(Box)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid slategray;
  padding: 0 2px;
  user-select: none;
  cursor: move;
  &:not(:last-child) {
    margin-bottom: 15px;
  }
`;

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
  padding: '0 12px',
  backgroundColor: theme.palette.vesoft.bgColor,
  ...(!open && {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: 0,
    overflowX: 'hidden',
    padding: 0,
    border: 'none',
  }),
}));

export const ScaleBtnContainer = styled(Box, {
  shouldForwardProp: (prop: string) => isPropValid(prop) || prop === 'variant',
})<BoxProps & { active?: boolean }>(({ theme, active }) => ({
  position: 'absolute',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  transition: theme.transitions.create('right', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  ...(active && {
    transition: theme.transitions.create('right', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    right: `calc(360px + ${theme.spacing(3)})`,
  }),
}));

export const shadowItem = css`
  opacity: 0.5;
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  margin: 0;
`;
