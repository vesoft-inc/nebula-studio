import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import Stack from '@mui/system/Stack';
import { useStore } from '@/stores';
import { ActionContentContainer, AppBar, AppToolbar, MainContentContainer, MenuTab, MenuTabs, TabMenu } from './styles';
import { useTranslation } from 'react-i18next';

export default observer(function PageLayout() {
  const theme = useTheme();
  const { themeStore } = useStore();
  const toggleTheme = useCallback(() => themeStore.toggleMode(), [themeStore]);
  const isDarkMode = theme.palette.mode === 'dark';
  const [curTab, setCurTab] = useState<TabMenu>(TabMenu.GraphType);
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const hanldeTabChange = (event: React.SyntheticEvent, tab: TabMenu) => {
    event.stopPropagation();
    setCurTab(tab);
    navigate(`${tab}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
              value={curTab}
              TabIndicatorProps={{
                sx: {
                  backgroundColor: theme.palette.vesoft?.themeColor1,
                },
              }}
              onChange={hanldeTabChange}
            >
              {Object.values(TabMenu).map((tab, index) => (
                <MenuTab key={index} active={curTab === tab} label={t(tab, { ns: 'common' })} value={tab} />
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
      <Box sx={{ display: 'flex' }}>
        <MainContentContainer>
          <Outlet />
        </MainContentContainer>
      </Box>
    </Box>
  );
});
