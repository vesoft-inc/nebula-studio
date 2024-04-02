import { css } from '@emotion/css';
import isPropValid from '@emotion/is-prop-valid';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { BoxProps } from '@mui/system';

export const NodeTypeListContainer = styled(Box)`
  display: flex;
  height: 100%;
`;

export const GraphContainer = styled(Box)`
  display: flex;
  flex: 1;
  height: 100%;
  margin-left: ${({ theme }) => theme.spacing(1)};
`;

export const GraphBox = styled(Box, {
  shouldForwardProp: (prop: string) => isPropValid(prop) || prop === 'variant',
})<BoxProps & { active?: boolean }>(({ theme, active }) => ({
  width: '100%',
  height: '100%',
  zIndex: 1,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  ...(active && {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: `calc(100% - 360px)`,
  }),
}));

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
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px dashed slategray;
  padding: 0 2px;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette.vesoft.textColor3};
  cursor: move;
  &:not(:last-child) {
    margin-bottom: 15px;
  }
`;

export const ScaleBtnContainer = styled(Box, {
  shouldForwardProp: (prop: string) => isPropValid(prop) || prop === 'variant',
})<BoxProps & { active?: boolean }>(({ theme, active }) => ({
  position: 'absolute',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: 1,
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

export const ColorBox = styled(Box)`
  width: 24px;
  height: 20px;
  border-radius: 6px;
  margin-right: ${({ theme }) => theme.spacing(1)};
`;

export const shadowItem = css`
  opacity: 0.5;
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  margin: 0;
`;
