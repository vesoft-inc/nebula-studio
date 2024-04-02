import { getVesoftBorder } from '@/utils';
import { Box, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ContentContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: calc(100vh - 240px);
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
`;

export const CreateGraphContainer = styled(Box)`
  position: relative;
  width: 100%;
  flex: 1;
  padding: ${({ theme }) => theme.spacing(2)};
  height: 100%;
  border: ${({ theme }) => `1px solid ${theme.palette.vesoft.bgColor11}`};
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
`;

export const StepContainer = styled(Box)`
  width: 100%;
  height: 100%;
`;

export const TableContainer = styled(Box)`
  width: 100%;
  flex: 1;
  padding: ${({ theme }) => theme.spacing(2)};
  height: 100%;
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

export const EditorWrapper = styled(Box)`
  border: ${getVesoftBorder};
  position: relative;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  height: 220px;
  resize: vertical;
  overflow: hidden;
`;
