import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter, ThemeWrapper } from '@vesoft-inc/utils';
import { StoreProvider, getRootStore } from '@/stores';
import i18n from '@/utils/i18n';
import App from '@/app';

export default function PageRoot() {
  const rootStore = getRootStore();
  return (
    <StrictMode>
      <StoreProvider value={rootStore}>
        <I18nextProvider i18n={i18n}>
          <ThemeWrapper>
            <BrowserRouter store={rootStore.routerStore}>
              <App />
            </BrowserRouter>
          </ThemeWrapper>
        </I18nextProvider>
      </StoreProvider>
    </StrictMode>
  );
}

const rootElement = document.getElementById('studioApp');
createRoot(rootElement!).render(<PageRoot />);
