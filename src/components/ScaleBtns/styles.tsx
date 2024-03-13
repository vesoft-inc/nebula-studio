import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ScalesBtnContainer = styled(Box)`
  width: 44px;
  height: 152px;
  display: flex;
  flex-direction: column;
`;

export const ScaleButton = styled(Button)`
  width: 44px;
  height: 44px;
  min-width: 44px;
  color: ${({ theme }) => theme.palette.vesoft.textColor3};

  &:not(:last-child) {
    margin-bottom: 8px;
  }
`;
