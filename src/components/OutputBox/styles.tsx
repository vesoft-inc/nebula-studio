import { styled } from '@mui/material/styles';
import Box, { BoxProps } from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { getVesoftBorder } from '@/utils';

export const OutputContainer = styled(Box)`
  margin-top: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  border-top: ${getVesoftBorder};
  border-bottom: ${getVesoftBorder};
  color: ${({ theme }) => theme.palette.vesoft.textColor1};
`;

export const OutputHeader = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing(1.5, 2)};
`;

export const HeaderTitle = styled(Box, { shouldForwardProp: (propName) => propName !== 'success' })<
  BoxProps & { success?: boolean }
>(({ theme, success }) => {
  const { vesoft } = theme.palette;
  return {
    flex: 1,
    height: '42px',
    fontWeight: 500,
    backgroundColor: success ? vesoft.status6Bg : vesoft.status8Bg,
    color: success ? vesoft.status2 : vesoft.status4,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0, 2),
    marginRight: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  };
});

export const HeaderAction = styled(Box)`
  width: 160px;
  flex: 0 0 160px;
  height: 100%;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  & > svg {
    cursor: pointer;
  }
`;

export const StyledIconButton = styled(IconButton)`
  color: ${({ theme }) => theme.palette.vesoft.textColor1};
`;

export const OutputContent = styled(Box)`
  height: 360px;
  border-top: ${getVesoftBorder};
  border-bottom: ${getVesoftBorder};
  display: flex;
`;

export const ContentSider = styled(Box)`
  flex: 0 0 50px;
`;

export const ContentMain = styled(Box)`
  flex: 1;
  border-left: ${getVesoftBorder};
  overflow: hidden;
`;
