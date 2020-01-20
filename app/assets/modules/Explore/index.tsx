import React from 'react';

import { trackPageView } from '#assets/utils/stat';

import Control from './Control';
import './index.less';
import Init from './Init';
import NebulaGraph from './NebulaGraph';

const Explore = () => {
  trackPageView('/explore');
  return (
    <div className="nebula-explore">
      <Control />
      <NebulaGraph />
      <Init />
    </div>
  );
};

export default Explore;
