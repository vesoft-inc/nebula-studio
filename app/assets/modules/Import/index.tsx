import React from 'react';

import './index.less';
import Progress from './Progress';
import Tasks from './Tasks';

const Import = () => {
  return (
    <div className="data-import">
      <Progress />
      <Tasks />
    </div>
  );
};

export default Import;
