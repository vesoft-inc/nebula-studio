import { Button } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { Link, withRouter } from 'react-router-dom';

import './CustomQuery.less';

function CustomQuery(): JSX.Element {
  return (
    <div className="query-custom">
      <img className="logo" src={intl.get('explore.customQueryUrl')} />
      <p>{intl.get('explore.customQueryDescription')}</p>
      <div className="btn">
        <Button>
          <Link to="/console">{intl.get('explore.openInConsole')}</Link>
        </Button>
      </div>
    </div>
  );
}

export default withRouter(CustomQuery);
