import React from 'react';

import Control from './Control';
import './index.less';
import NebulaGraph from './NebulaGraph';

const Explore = () => {
  return (
    <div className="nebula-explore">
      <Control />
      <NebulaGraph />
    </div>
  );
};

export default Explore;
