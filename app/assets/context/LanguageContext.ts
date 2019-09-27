import React from 'react'

import { INTL_LOCALE_SELECT }  from '../config'

export const LanguageContext = React.createContext({
  currentLocale: INTL_LOCALE_SELECT.EN_US.NAME,
  toggleLanguage: (locale: string) => { 
    console.log('Select locale:', locale)
  }
})