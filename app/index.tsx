import { message } from 'antd';
import React from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import Cookie from 'js-cookie';
import intl from 'react-intl-universal';
import { INTL_LOCALES } from '#app/config/constants';

import App from './App';
import { store } from './store';

const defaultLanguage = Cookie.get('lang') || document.documentElement.getAttribute('lang');
intl.init({
  currentLocale: defaultLanguage || 'EN_US',
  locales: INTL_LOCALES,
});

message.config({
  maxCount: 1,
});
ReactDom.render(
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>,
  document.getElementById('app'),
);
