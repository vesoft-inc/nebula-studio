import { Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { AppBar, MainContentContainer } from './styles';

export default function PageLayout() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <AppBar>
        <Toolbar sx={{ pr: '24px' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ marginRight: (theme) => theme.spacing(2) }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            loading="lazy"
            height={38}
            width={115}
            alt="NebulaGraph Studio"
            src={isDarkMode ? '/images/studio-logo-dark.png' : '/images/studio-logo-light.png'}
          />
          <Box sx={{ flexGrow: 1 }}></Box>
          <Box sx={{ flexGrow: 0 }}>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex' }}>
        <MainContentContainer>
          <Outlet />
        </MainContentContainer>
      </Box>
    </Box>
  );
}
