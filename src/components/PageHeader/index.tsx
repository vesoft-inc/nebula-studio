import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import Stack from '@mui/system/Stack';
import { useStore } from '@/stores';
import { PageRoute } from '@/utils/constant';
import { AbsoluteLink, ActionContentContainer, AppBar, AppToolbar, MenuTab, MenuTabs } from './styles';

export default observer(function PageHeader() {
  const { themeStore } = useStore();
  const { t } = useTranslation(['common']);
  const toggleTheme = useCallback(() => themeStore.toggleMode(), [themeStore]);

  const currentRoute = useLocation().pathname.split('/')[1] as PageRoute;
  const isDarkMode = themeStore.mode === 'dark';
  return (
    <AppBar position="static">
      <AppToolbar>
        <Box
          component="img"
          loading="lazy"
          height={38}
          width={115}
          alt="NebulaGraph Studio"
          src={isDarkMode ? '/images/studio-logo-dark.png' : '/images/studio-logo-light.png'}
        />
        <ActionContentContainer>
          <MenuTabs
            value={currentRoute}
            TabIndicatorProps={{
              sx: { backgroundColor: themeStore.palette.vesoft?.themeColor1 },
            }}
          >
            {Object.values(PageRoute).map((route) => (
              <MenuTab
                key={route}
                value={route}
                label={<AbsoluteLink to={route}>{t(route, { ns: 'common' })}</AbsoluteLink>}
              />
            ))}
          </MenuTabs>
        </ActionContentContainer>
        <Box sx={{ flexGrow: 0 }}>
          <Stack direction="row" spacing={1}>
            <IconButton color="primary">
              <NotificationsIcon />
            </IconButton>
            <IconButton color="primary">
              <SettingsIcon />
            </IconButton>
            <IconButton color="primary" onClick={toggleTheme}>
              {isDarkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
          </Stack>
        </Box>
      </AppToolbar>
    </AppBar>
  );
});
