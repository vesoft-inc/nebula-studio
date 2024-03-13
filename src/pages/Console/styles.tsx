import type { Theme } from '@emotion/react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

const getVesoftBorderColor = ({ theme }: { theme: Theme }) => theme.palette.vesoft.textColor6;

export const StyledSider = styled(Box)`
  flex: 0;
  display: flex;
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
`;

export const SiderItem = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid ${getVesoftBorderColor};
`;

export const SiderItemHeader = styled(Box)`
  flex: 0 0 60px;
  height: 60px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.palette.vesoft.textColor1};
  border-bottom: 1px solid ${getVesoftBorderColor};
  padding: ${({ theme }) => theme.spacing(1.5, 2)};
  font-size: 16px;
  font-weight: 600;
`;

export const InputArea = styled(Box)`
  padding: ${({ theme }) => theme.spacing(0.5, 2, 0)};
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  border-bottom: 1px solid ${getVesoftBorderColor};
`;

export const ActionWrapper = styled(Box)`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const StyledIconButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.vesoft.textColor1};
`;

export const RunButton = styled(Button)`
  background-color: ${({ theme }) => theme.palette.vesoft.themeColor1};
  color: ${({ theme }) => theme.palette.vesoft.textColor8};
  height: '36px';
`;

export const EditorWrapper = styled(Box)`
  border: 1px solid ${getVesoftBorderColor};
  position: relative;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  min-height: 120px;
  resize: vertical;
  overflow: hidden;
`;
