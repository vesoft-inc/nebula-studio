import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LoginPage from '@src/pages/Login';
import { StoreProvider, getRootStore } from '@src/stores';

const theme = createTheme({
  palette: { mode: 'light' },
});

export default function PageRoot() {
  return (
    <StrictMode>
      <CssBaseline />
      <StoreProvider value={getRootStore()}>
        <ThemeProvider theme={theme}>
          <LoginPage />
        </ThemeProvider>
      </StoreProvider>
    </StrictMode>
  );
}

const rootElement = document.getElementById('studioApp');
createRoot(rootElement!).render(<PageRoot />);
