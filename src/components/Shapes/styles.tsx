import styled from '@emotion/styled';
import { Box } from '@mui/material';

export const ActiveNodeCicle = styled.circle`
  opacity: 0;
  fill: transparent;
`;

export const LabelContainer = styled(Box)`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .span {
    text-align: center;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 70%;
    font-size: 12px;
    user-select: none;
  }
`;

export const EdgeLabelContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 100%;
  font-size: 12px;
  height: 100%;

  > span {
    height: 100%;
    position: relative;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 10px;
    white-space: nowrap;
    user-select: none;
    padding: 0 3px;
  }
`;

export const InvalidContainer = styled(Box)`
  width: 10px;
  height: 10px;
  display: inline-block;
  position: absolute;
  top: 0px;
  background-image: url('@app/static/images/invalid.svg');
`;
