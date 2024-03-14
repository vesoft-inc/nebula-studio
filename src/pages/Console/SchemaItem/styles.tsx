import { styled } from '@mui/material/styles';
import ListItemIcon from '@mui/material/ListItemIcon';

export const StyledListItemIcon = styled(ListItemIcon)`
  min-width: auto;
  margin: ${({ theme }) => theme.spacing(0, 1.5, 0, 1)};
`;
