import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LanguageIcon from '@mui/icons-material/Language';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/system/Stack';
import { useStore } from '@/stores';
import { PageRoute } from '@/utils/constant';
import { Language } from '@/utils/i18n';
import { AbsoluteLink, ActionContentContainer, AppBar, AppToolbar, MenuTab, MenuTabs } from './styles';

export default observer(function PageHeader() {
  const { themeStore, commonStore } = useStore();
  const [anchorEle, setAnchorEle] = useState<null | HTMLElement>(null);
  const { t } = useTranslation(['common']);
  const toggleTheme = useCallback(() => themeStore.toggleMode(), [themeStore]);
  const changeLang = useCallback(
    (lang: Language) => {
      commonStore.setLanguage(lang);
      setAnchorEle(null);
    },
    [commonStore]
  );

  const currentRoute = useLocation().pathname.split('/')[1] as PageRoute | undefined;
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
            value={currentRoute || false}
            TabIndicatorProps={{
              sx: { backgroundColor: themeStore.palette.vesoft?.themeColor1 },
            }}
          >
            {Object.values(PageRoute).map((route) => (
              <MenuTab
                key={route}
                value={route}
                label={
                  <Box component="span">
                    {t(route, { ns: 'common' })}
                    <AbsoluteLink to={route} />
                  </Box>
                }
              />
            ))}
          </MenuTabs>
        </ActionContentContainer>
        <Box sx={{ flexGrow: 0 }}>
          <Stack direction="row" spacing={1}>
            <IconButton color="primary" aria-haspopup="menu" onClick={(e) => setAnchorEle(e.currentTarget)}>
              <LanguageIcon />
            </IconButton>
            <IconButton color="primary" onClick={toggleTheme}>
              {isDarkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
          </Stack>
        </Box>
      </AppToolbar>
      <Menu
        anchorEl={anchorEle}
        open={!!anchorEle}
        onClose={() => setAnchorEle(null)}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
      >
        <MenuItem onClick={() => changeLang(Language.EN_US)}>English</MenuItem>
        <MenuItem onClick={() => changeLang(Language.ZH_CN)}>中文</MenuItem>
      </Menu>
    </AppBar>
  );
});
