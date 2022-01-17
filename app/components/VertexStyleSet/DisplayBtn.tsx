import classnames from 'classnames';
import _ from 'lodash';
import React from 'react';

import Icon from '#app/components/Icon';

interface IProps {
  icon?: string;
  color: string;
}

class DisplayBtn extends React.PureComponent<IProps> {
  render() {
    const { icon, color } = this.props;
    return (
      <div className="btn-nodeStyle-set">
        <div className="color-group">
          <div
            className={classnames('btn-color')}
            style={{ background: color }}
          >
            {icon && <Icon className="icon-selected" type={icon} />}
          </div>
        </div>
      </div>
    );
  }
}

export default DisplayBtn;
