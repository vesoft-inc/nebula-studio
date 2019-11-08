import React from 'react';

import Control from './Control';
import './index.less';
import Init from './Init';
import NebulaGraph from './NebulaGraph';

const Explore = () => {
  return (
    <div className="nebula-explore">
      <Control />
      <NebulaGraph />
      <Init />
    </div>
  );
};

export default Explore;
