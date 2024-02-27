import type { Theme } from '@emotion/react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';

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
  height: 60px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.palette.vesoft.textColor1};
  border-bottom: 1px solid ${getVesoftBorderColor};
  padding: ${({ theme }) => theme.spacing(1.5, 2)};
  font-size: 16px;
  font-weight: 600;
`;

export const StyledMenuItem = styled(MenuItem)`
  height: 60px;
  justify-content: center;
  transition: background-color ${({ theme }) => theme.transitions.easing.easeInOut} 0.25s;
  color: ${({ theme }) => theme.palette.vesoft.textColor1};
  &.Mui-selected,
  &.Mui-selected:hover {
    background-color: ${({ theme }) => theme.palette.vesoft.themeColor1};
  }
`;

export const InputArea = styled(Box)`
  padding: 0 ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  border-bottom: 1px solid ${getVesoftBorderColor};
`;

export const ActionWrapper = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const EditorWrapper = styled(Box)`
  border: 1px solid ${getVesoftBorderColor};
  position: relative;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  min-height: 120px;
  resize: vertical;
  overflow: hidden;
`;
