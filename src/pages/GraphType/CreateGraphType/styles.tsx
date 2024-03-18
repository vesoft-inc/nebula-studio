import { Box } from '@mui/material';
import styled from '@mui/system/styled';

export const ContentContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: calc(100vh - 180px);
`;

export const ActionContainer = styled(Box)`
  display: flex;
  align-items: center;
`;

export const FooterHeight = 70;

export const MainContainer = styled(Box)`
  position: relative;
  width: 100%;
  flex: 1;
  margin-bottom: ${FooterHeight + 30}px;
  margin-top: 20px;
  min-height: 660px;
  padding: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  /* height: calc(100% - ${FooterHeight}px); */
`;

export const FooterContainer = styled(Box)`
  width: 100%;
  height: ${FooterHeight}px;
  position: fixed;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  border-top: 1px solid ${({ theme }) => theme.palette.vesoft.bgColor11};
`;
