import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { styled } from '@mui/material/styles';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab, { type TabProps } from '@mui/material/Tab';

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

export const AppBarHeight = 64;

export const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>`
  position: relative;
  height: ${AppBarHeight}px;
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
  color: ${({ theme }) => theme.palette.vesoft.textColor2};
  z-index: ${({ theme }) => theme.zIndex.drawer + 1};
`;

export const AppToolbar = styled(Toolbar)`
  padding-right: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.vesoft.bgColor};
`;

export const ActionContentContainer = styled(Box)`
  height: 100%;
  display: flex;
  flex: 1;
  align-items: flex-end;
`;

export const MenuTabs = styled(Tabs)`
  margin-left: ${({ theme }) => theme.spacing(2)};
`;

export const MenuTab = styled(Tab)<TabProps<'a'>>`
  font-weight: bold;
  height: ${AppBarHeight}px;
`;

export const AbsoluteLink = styled(Link)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  text-decoration: none;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;
