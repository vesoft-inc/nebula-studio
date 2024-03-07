import { styled } from '@mui/material/styles';
import Box from '@mui/system/Box';
import type { Theme } from '@emotion/react';

const getVesoftBorderColor = ({ theme }: { theme: Theme }) => theme.palette.vesoft.textColor6;

export const OutputContainer = styled(Box)`
  margin-top: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  border-top: 1px solid ${getVesoftBorderColor};
  border-bottom: 1px solid ${getVesoftBorderColor};
  color: ${({ theme }) => theme.palette.vesoft.textColor1};
`;

export const OutputHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(1.5, 2)};
`;

export const HeaderTitle = styled(Box)`
  flex: 1;
  height: 42px;
  background-color: ${({ theme }) => theme.palette.vesoft.status6Bg};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  padding: ${({ theme }) => theme.spacing(0, 2)};
  margin-right: ${({ theme }) => theme.spacing(2)};
  display: flex;
  align-items: center;
`;

export const HeaderAction = styled(Box)`
  width: 160px;
  flex: 0 0 160px;
  height: 100%;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  & > svg {
    cursor: pointer;
  }
`;

export const OutputContent = styled(Box)`
  height: 300px;
  border-top: 1px solid ${getVesoftBorderColor};
  border-bottom: 1px solid ${getVesoftBorderColor};
  display: flex;
`;

export const ContentSider = styled(Box)`
  flex: 0 0 50px;
`;

export const ContentMain = styled(Box)`
  flex: 1;
  border-left: 1px solid ${getVesoftBorderColor};
`;
