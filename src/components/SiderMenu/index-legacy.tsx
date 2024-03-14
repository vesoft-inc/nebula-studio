import { useCallback } from 'react';
import { Menu, type IMenuRouteItem } from '@vesoft-inc/ui-components';

interface IProps {
  active?: string;
  onChange: (active: string) => void;
  items: IMenuRouteItem[];
  width?: number;
}

export default function SiderMenu(props: IProps) {
  const { active, onChange, items, width } = props;

  const handleMenuClick = useCallback(
    (menuItem: IMenuRouteItem) => {
      onChange?.(menuItem.key);
    },
    [onChange]
  );

  const selectedKeys = active ? [active] : [];
  return (
    <Menu
      closeWidth={width}
      canToggle={false}
      items={items}
      selectedKeys={selectedKeys}
      onMenuClick={handleMenuClick}
      activeSlotProps={{
        menuListItemButton: {
          sx: (theme) => ({
            backgroundColor: theme.palette.vesoft.themeColor1,
            height: theme.spacing(8),
            borderRadius: 0,
            '&:hover': {
              borderRadius: 0,
              backgroundColor: theme.palette.vesoft.themeColor1,
            },
          }),
        },
        menuItemIcon: {
          sx: {
            color: ({ palette }) => palette.vesoft.textColor8,
          },
        },
      }}
      slotProps={{
        drawer: {
          variant: 'permanent',
          PaperProps: {
            sx: {
              borderRight: 'none',
              display: 'block',
              backgroundColor: 'inherit',
            },
          },
          sx: {
            width: ({ spacing }) => spacing(8),
          },
        },
        menuListItemButton: {
          sx: {
            height: ({ spacing }) => spacing(8),
            '&:hover': {
              borderRadius: 0,
              backgroundColor: ({ palette }) => palette.vesoft.themeColor1,
            },
          },
        },
        menuItemIcon: {
          sx: {
            color: ({ palette }) => palette.vesoft.textColor1,
          },
        },
      }}
    />
  );
}
