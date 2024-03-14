import type { ReactNode } from 'react';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Tooltip from '@mui/material/Tooltip';
import ListItemText from '@mui/material/ListItemText';
import { StyledListItem } from './styles';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SiderMenuItem {
  key: string;
  label?: ReactNode;
  icon?: ReactNode;
  sx?: SxProps<Theme>;
}

export interface SiderMenuProps {
  items: SiderMenuItem[];
  mode?: 'normal' | 'tiny';
  activeKey?: string;
  onMenuClick?: (key: string, item: SiderMenuItem, event: React.MouseEvent) => void;
  wrapSx?: SxProps<Theme>;
}

export default function SiderMenu(props: SiderMenuProps) {
  const { items, mode = 'tiny', activeKey, onMenuClick, wrapSx } = props;
  const defaultItemSx = { justifyContent: 'center', alignItems: 'center', minWidth: 0, px: 1.5 };
  const isTinyMode = mode === 'tiny';
  return (
    <List sx={wrapSx}>
      {items.map((item) => (
        <StyledListItem key={item.key} disablePadding active={item.key === activeKey}>
          <Tooltip title={isTinyMode ? item.label : undefined} placement="right">
            <ListItemButton
              sx={Array.isArray(item.sx) ? [defaultItemSx, ...item.sx] : [defaultItemSx, item.sx]}
              onClick={(e) => onMenuClick?.(item.key, item, e)}
            >
              <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>{item.icon}</ListItemIcon>
              {!isTinyMode && <ListItemText primary={item.label} sx={{ ml: 1, color: 'inherit' }} />}
            </ListItemButton>
          </Tooltip>
        </StyledListItem>
      ))}
    </List>
  );
}
