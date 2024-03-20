import { Box, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';

export const NodeTypeInfoContainer = styled(Box)`
  padding: 10px 16px;
`;

export const PropertyHeaderCell = styled(Box)`
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor2};
  padding: ${({ theme }) => theme.spacing(1)};
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
