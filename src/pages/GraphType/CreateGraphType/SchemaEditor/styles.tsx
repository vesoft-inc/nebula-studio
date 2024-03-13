import { css } from '@emotion/css';
import { Box } from '@mui/material';
import styled from '@mui/system/styled';

export const NodeTypeListContainer = styled(Box)`
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

export const shadowItem = css`
  opacity: 0.5;
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  margin: 0;
`;
