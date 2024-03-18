import { Box, Drawer } from '@mui/material';
import { styled } from '@mui/material/styles';

export const SchemaDrawerontainer = styled(Drawer, {})`
  flex-shrink: 0;
  height: 100%;
  & .MuiDrawer-paper {
    border-radius: 6px;
    position: relative;
    border: 1px solid ${({ theme }) => theme.palette.vesoft.bgColor11};
  }
`;

export const ActionsContainer = styled(Box)`
  height: 64px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.vesoft.bgColor11};
  display: flex;
  align-items: center;
  padding: 10px 16px;
`;

export const NodeTypeInfoContainer = styled(Box)`
  padding: 10px 16px;
`;
