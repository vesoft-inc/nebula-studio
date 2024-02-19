import i18next from 'i18next';
import en_US from './en_US';
import zh_CN from './zh_CN';

export const defaultNS = 'common';

export const enum Language {
  EN_US = 'en_US',
  ZH_CN = 'zh_CN',
}

const i18n = i18next.createInstance();

i18n.init({
  lng: Language.ZH_CN,
  fallbackLng: Language.ZH_CN,
  debug: process.env.NODE_ENV === 'development',
  resources: {
    [Language.EN_US]: en_US,
    [Language.ZH_CN]: zh_CN,
  },
});

export default i18n;
