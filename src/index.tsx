import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from '@/components/BroserRouter';
import { StoreProvider, getRootStore } from '@/stores';
import i18n from '@/utils/i18n';
import App from '@/app';

const theme = createTheme({
  palette: { mode: 'light' },
});

export default function PageRoot() {
  const rootStore = getRootStore();
  return (
    <StrictMode>
      <StoreProvider value={rootStore}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter store={rootStore.routerStore}>
              <App />
            </BrowserRouter>
          </ThemeProvider>
        </I18nextProvider>
      </StoreProvider>
    </StrictMode>
  );
}

const rootElement = document.getElementById('studioApp');
createRoot(rootElement!).render(<PageRoot />);
