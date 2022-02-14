import React from 'react';
import intl from 'react-intl-universal';
import Cookie from 'js-cookie';
import { INTL_LOCALES, INTL_LOCALE_SELECT } from '@appv2/config/constants';
export const LanguageContext = React.createContext({
  currentLocale: INTL_LOCALE_SELECT.EN_US.NAME,
  toggleLanguage: (currentLocale: string) => {
    Cookie.set('lang', currentLocale);
    intl.init({
      currentLocale,
      locales: INTL_LOCALES,
    });
  },
});
