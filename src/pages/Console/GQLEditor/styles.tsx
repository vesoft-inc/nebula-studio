import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';

export const StyledChip = styled(Chip)`
  opacity: ${({ theme }) => (theme.palette.mode === 'dark' ? 0.5 : 0.7)};
`;
