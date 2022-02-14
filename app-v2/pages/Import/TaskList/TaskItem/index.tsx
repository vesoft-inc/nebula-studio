import { Button, Progress } from 'antd';
import _ from 'lodash';
import React from 'react';
import './index.less';
import { ITaskItem } from '@appv2/interfaces/import'

interface IProps {
  data: ITaskItem;
}

const TaskItem = (props: IProps) => {
  const { data } = props;
  return (
    <div className="task-item">
      <div className="row">
        <span>Space: {data.space}</span>
        <Button type="link" size='small'>Download Config</Button>
      </div>
      <div className="row">
        <div className="progress">
          <div className="progress-info">
            <span className="task-name">{data.name}</span>
            <div className="more-info">
              <span>
                {data.statsQuery.totalCount} Lines / {data.statsQuery.totalLine}{' '}
                Lines
              </span>
              <span>00:10:23</span>
            </div>
          </div>
          <Progress percent={30} />
        </div>
        <div className="operations">
          <Button>Details</Button>
          <Button>View Logs</Button>
          <Button>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
