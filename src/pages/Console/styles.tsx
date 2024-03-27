import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { getVesoftPaletteColor } from '@vesoft-inc/utils';
import { getVesoftBorder } from '@/utils';

export const StyledSider = styled(Box)`
  flex: 0;
  display: flex;
  background-color: ${getVesoftPaletteColor('bgColor')};
`;

export const SiderItem = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: ${getVesoftBorder};
`;

export const SiderItemHeader = styled(Box)`
  flex: 0 0 60px;
  height: 60px;
  display: flex;
  align-items: center;
  color: ${getVesoftPaletteColor('textColor1')};
  border-bottom: ${getVesoftBorder};
  padding: ${({ theme }) => theme.spacing(1.5, 2)};
  font-size: 16px;
  font-weight: 600;
`;

export const InputArea = styled(Box)`
  padding: ${({ theme }) => theme.spacing(0.5, 2, 0)};
  background-color: ${getVesoftPaletteColor('bgColor')};
  border-bottom: ${getVesoftBorder};
`;

export const ActionWrapper = styled(Box)`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const StyledIconButton = styled(IconButton)`
  color: ${getVesoftPaletteColor('textColor1')};
`;

export const RunButton = styled(LoadingButton)`
  background-color: ${getVesoftPaletteColor('themeColor1')};
  color: ${getVesoftPaletteColor('textColor8')};
  height: 36px;
`;

export const EditorWrapper = styled(Box)`
  border: ${getVesoftBorder};
  position: relative;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  min-height: 120px;
  resize: vertical;
  overflow: hidden;
`;
