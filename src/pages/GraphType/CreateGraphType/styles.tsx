import { Box, Divider } from '@mui/material';
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

export const TypeInfoContainer = styled(Box)`
  padding: 10px 16px;
`;

export const PropertyHeaderCell = styled(Box)`
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor2};
  padding: ${({ theme }) => theme.spacing(1)};
  padding-left: ${({ theme }) => theme.spacing(3)};
  text-align: center;
  flex: 1;
  position: relative;
  &:before {
    content: '';
    width: 2px;
    background-color: ${({ theme }) => theme.palette.vesoft.textColor6};
    height: 50%;
    position: absolute;
    top: 25%;
    left: ${({ theme }) => theme.spacing(1)};
  }
`;

export const PropertyBodyCell = styled(Box)`
  padding: ${({ theme }) => theme.spacing(1)};
  text-align: center;
  flex: 1;
`;

export const PropertyHeaderDivider = styled(Divider)`
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor2};
  height: 50%;
  margin-top: 25%;
`;
