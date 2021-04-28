import { Button } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';

import { LanguageContext } from '#assets/context';
import guideEnPng from '#assets/static/images/go-to-explore_en.png';
import guideZhPng from '#assets/static/images/go-to-explore_zh.png';

import './index.less';
class CustomQuery extends React.PureComponent {
  static contextType = LanguageContext;
  render() {
    const lang = this.context.currentLocale || 'ZH_CN';
    return (
      <div className="query-custom">
        <img
          className="logo"
          src={lang === 'ZH_CN' ? guideZhPng : guideEnPng}
        />
        <p>{intl.get('explore.customQueryDescription')}</p>
        <div className="btn">
          <Button>
            <Link
              to="/console"
              data-track-category="navigation"
              data-track-action="view_console"
              data-track-label="from_explore_btn"
            >
              {intl.get('explore.openInConsole')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }
}

export default CustomQuery;
