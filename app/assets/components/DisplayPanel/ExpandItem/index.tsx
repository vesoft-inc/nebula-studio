import { Icon } from 'antd';
import classnames from 'classnames';
import React from 'react';
import intl from 'react-intl-universal';

import IconFont from '#assets/components/Icon';
import { convertBigNumberToString } from '#assets/utils/function';

import './index.less';

interface IProps {
  data: any;
  title: string;
  index: number;
}

interface IState {
  expandedAll: boolean;
  expandedRestInfo: boolean;
  needExpandRest: boolean;
}

const EXPAND_NUM = 3;

class RowItem extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      expandedAll: false,
      expandedRestInfo: false,
      needExpandRest: false,
    };
  }
  componentDidMount() {
    const { data, index } = this.props;
    if (data.length > EXPAND_NUM) {
      this.setState({ needExpandRest: true });
    }
    if (index === 0) {
      this.setState({ expandedAll: true });
    }
  }

  toggleExpandAll = () => {
    const { expandedAll } = this.state;
    this.setState({
      expandedAll: !expandedAll,
    });
  };
  toggleExpandRest = () => {
    const { expandedRestInfo } = this.state;
    this.setState({
      expandedRestInfo: !expandedRestInfo,
    });
  };

  handleShowValue = data => {
    const { key, value } = data;
    if (typeof value === 'string') {
      if (key === 'vid' && data.vidType === 'INT64') {
        return value;
      } else {
        return JSON.stringify(value, (_, v) => {
          return v.replace(/\u0000+$/, '');
        });
      }
    } else if (typeof value === 'boolean') {
      return value.toString();
    } else {
      return convertBigNumberToString(value); // TODO: bigint in props does not be convert
    }
  };

  render() {
    const { expandedAll, needExpandRest, expandedRestInfo } = this.state;
    const { data, title } = this.props;
    return (
      <div className="display-row-item">
        <div
          className={classnames('item-header', 'row', { active: expandedAll })}
          onClick={this.toggleExpandAll}
        >
          {expandedAll ? <Icon type="down" /> : <Icon type="right" />}
          <span className="display-header-title">{title}</span>
        </div>
        {expandedAll && (
          <>
            {data.slice(0, EXPAND_NUM).map(item => (
              <div className="item-content" key={item.key}>
                <span className="item-key">{item.key} :</span>
                <span className="item-value">{this.handleShowValue(item)}</span>
              </div>
            ))}
            {needExpandRest && (
              <>
                {expandedRestInfo ? (
                  <>
                    {data.slice(EXPAND_NUM).map(item => (
                      <div className="item-content" key={item.key}>
                        <span className="item-key">{item.key}</span>
                        <span className="item-value">
                          {this.handleShowValue(item)}
                        </span>
                      </div>
                    ))}
                    <div
                      className="item-operation row"
                      onClick={this.toggleExpandRest}
                    >
                      <IconFont type="iconstudio-seletup" />
                      <span>{intl.get('explore.collapseItem')}</span>
                    </div>
                  </>
                ) : (
                  <div
                    className="item-operation row"
                    onClick={this.toggleExpandRest}
                  >
                    <IconFont type="iconstudio-seletexpand" />
                    <span>{intl.get('explore.expandItem')}</span>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    );
  }
}

export default RowItem;
