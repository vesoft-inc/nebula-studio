import { Drawer } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import IconFont from '#app/components/Icon';
import { IDispatch, IRootState } from '#app/store';

import Expand from './ExpandForm';
import './index.less';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
  showSider: state.d3Graph.showSider,
  currentSpace: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  toggleExpand: data => dispatch.d3Graph.update(data),
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
}

class ExpandBtn extends React.PureComponent<IProps> {
  handleClose = () => {
    this.props.toggleExpand({
      showSider: false,
    });
  };

  handleOpen = () => {
    this.props.toggleExpand({
      showSider: true,
    });
  };

  render() {
    const { currentSpace, showSider } = this.props;
    if (currentSpace) {
      return (
        <>
          <Drawer
            title={<span>{intl.get('explore.expansionConditions')}</span>}
            visible={showSider}
            className="expand-drawer"
            width="300"
            onClose={this.handleClose}
            getContainer={false}
            closable={false}
            mask={false}
            placement="right"
          >
            <Expand close={this.handleClose} />
          </Drawer>
          {!showSider && (
            <div className="expand-sider">
              <div className="btn-expand" onClick={this.handleOpen}>
                <IconFont
                  type="iconstudio-expandcondition"
                  className="icon-expand"
                  data-track-category="explore"
                  data-track-action="expand_sider_open"
                />
                {intl.get('explore.expand')}
              </div>
              <div className="sider-footer">
                <IconFont
                  type="iconstudio-indentright"
                  className="icon-collapse"
                  onClick={this.handleOpen}
                  data-track-category="explore"
                  data-track-action="expand_sider_open"
                />
              </div>
            </div>
          )}
        </>
      );
    }
    return null;
  }
}
export default connect(mapState, mapDispatch)(ExpandBtn);
