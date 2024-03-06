import { Card, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';

export const TypeCountTypography = styled(Typography)`
  color: ${({ theme }) => theme.palette.vesoft.bgColor8};
  margin-right: ${({ theme }) => theme.spacing(2)};
  font-size: 14px;
`;

export const GraphCard = styled(Card)`
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  border-color: ${({ theme }) => theme.palette.vesoft.bgColor11};
  height: 85px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 30px;
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows[8]};
    cursor: pointer;
  }
`;
