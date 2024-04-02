import { Box, SxProps, Theme } from '@mui/material';
import styled from '@mui/material/styles/styled';

export const schemaTextSx: SxProps<Theme> = {
  color: (theme) => theme.palette.vesoft?.textColor1,
  fontWeight: 600,
  fontSize: '16px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const BoxContainer = styled(Box)`
  &:not(:first-of-type): {
    margin-top: 2;
  }
`;
