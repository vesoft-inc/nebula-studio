import { useState, useCallback } from 'react';
import { useTheme } from '@emotion/react';
import { Menu, type IMenuRouteItem } from '@vesoft-inc/ui-components';
import {
  QueryTemplate,
  TrayArrowUp,
  ExpandLessFilled,
  CloseFilled,
  Table,
  CodeBracesBox,
  ExplorerDataOutline,
  Stethoscope,
} from '@vesoft-inc/icons';
import {
  OutputContainer,
  OutputHeader,
  HeaderTitle,
  HeaderAction,
  OutputContent,
  ContentSider,
  ContentMain,
} from './styles';

export function OutputBox() {
  const theme = useTheme();
  const [activeMenu, setActiveMenu] = useState('Table');
  const handleMenuClick = useCallback((menuItem: IMenuRouteItem) => {
    setActiveMenu(menuItem.key);
  }, []);
  return (
    <OutputContainer sx={{ flex: 1 }}>
      <OutputHeader>
        <HeaderTitle>111</HeaderTitle>
        <HeaderAction>
          <QueryTemplate />
          <TrayArrowUp />
          <ExpandLessFilled />
          <CloseFilled />
        </HeaderAction>
      </OutputHeader>
      <OutputContent>
        <ContentSider>
          <Menu
            canToggle={false}
            closeWidth={50}
            items={[
              {
                key: 'Table',
                label: 'Table',
                icon: <Table fontSize="medium" />,
              },
              {
                key: 'CodeBraces',
                label: 'CodeBraces',
                icon: <CodeBracesBox fontSize="medium" />,
              },
              {
                key: 'ExplorerData',
                label: 'ExplorerData',
                icon: <ExplorerDataOutline fontSize="medium" />,
              },
              {
                key: 'Stethoscope',
                label: 'Stethoscope',
                icon: <Stethoscope fontSize="medium" />,
              },
            ]}
            selectedKeys={activeMenu ? [activeMenu] : []}
            onMenuClick={handleMenuClick}
            activeSlotProps={{
              menuListItemButton: {
                sx: {
                  height: '50px',
                  borderRadius: 0,
                  justifyContent: 'center',
                  backgroundColor: theme.palette.vesoft.themeColor1,
                  paddingLeft: 0,
                  paddingRight: 0,
                  position: 'relative',
                  '&:hover': {
                    borderRadius: 0,
                    backgroundColor: theme.palette.vesoft.themeColor1,
                  },
                },
              },
              menuItemIcon: {
                sx: {
                  color: theme.palette.vesoft.textColor8,
                },
              },
            }}
            slotProps={{
              drawer: {
                variant: 'permanent',
                sx: {
                  '& .MuiDrawer-paper': {
                    borderRight: 'none',
                    display: 'block',
                    backgroundColor: 'inherit',
                  },
                },
              },
              menuListItemButton: {
                sx: {
                  height: '50px',
                  justifyContent: 'center',
                  paddingLeft: 0,
                  paddingRight: 0,
                  '&:hover': {
                    borderRadius: 0,
                    backgroundColor: theme.palette.vesoft.themeColor1,
                  },
                },
              },
              menuItemIcon: {
                sx: {
                  color: theme.palette.vesoft.textColor1,
                },
              },
            }}
          />
        </ContentSider>
        <ContentMain />
      </OutputContent>
    </OutputContainer>
  );
}
