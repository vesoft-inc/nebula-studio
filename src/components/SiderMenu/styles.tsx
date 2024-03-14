import ListItem, { type ListItemProps } from '@mui/material/ListItem';
import { styled } from '@mui/material/styles';

export const StyledListItem = styled(ListItem, { shouldForwardProp: (propName) => propName !== 'active' })<
  ListItemProps & { active?: boolean }
>`
  display: block;
  color: ${({ theme }) => theme.palette.vesoft.textColor1};
  ${({ theme: { palette }, active }) =>
    active &&
    `
    background-color: ${palette.vesoft.themeColor1};
    color: ${palette.vesoft.textColor8};
    &:hover {
      background-color: ${palette.vesoft.themeColor1};
    }
  `}
`;
