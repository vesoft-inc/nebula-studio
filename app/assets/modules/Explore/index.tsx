import React from 'react';

import { NebulaToD3Data } from '#assets/components';
import data from '#assets/components/NebulaToD3Data/data';

import Control from './Control';
import './index.less';

const Explore = () => {
  return (
    <div className="nebula-explore">
      <Control />
      {<NebulaToD3Data width={1200} height={900} data={data} />}
    </div>
  );
};

export default Explore;
