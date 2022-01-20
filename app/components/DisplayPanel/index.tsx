import { Drawer } from 'antd';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import Expand from './ExpandForm';
import IconFont from '#app/components/Icon';
import { IDispatch, IRootState } from '#app/store';

import './index.less';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
  selectEdges: state.explore.selectEdges,
  showDisplayPanel: state.d3Graph.showDisplayPanel,
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

class DisplayPanel extends React.PureComponent<IProps> {
  handleClose = () => {
    this.props.toggleExpand({
      showDisplayPanel: false,
    });
  };

  handleOpen = () => {
    this.props.toggleExpand({
      showDisplayPanel: true,
    });
  };

  render() {
    const {
      currentSpace,
      selectVertexes,
      selectEdges,
      showDisplayPanel,
    } = this.props;
    if (currentSpace) {
      return (
        <>
          <Drawer
            visible={showDisplayPanel}
            className="display-drawer"
            width="290"
            onClose={this.handleClose}
            closable={false}
            getContainer={false}
            mask={false}
            placement="left"
          >
            <Expand close={this.handleClose} />
          </Drawer>
          {!showDisplayPanel && (
            <div className="display-sider">
              <div
                className="display-label"
                data-track-category="explore"
                data-track-action="display_sider_open"
                onClick={this.handleOpen}
              >
                <IconFont type="iconstudio-vertex" />
                {selectVertexes.length}
              </div>
              <div
                className="display-label"
                data-track-category="explore"
                data-track-action="display_sider_open"
                onClick={this.handleOpen}
              >
                <IconFont type="iconstudio-edge" />
                {selectEdges.length}
              </div>
              <div className="sider-footer">
                <IconFont
                  type="iconstudio-indentleft"
                  className="icon-collapse"
                  data-track-category="explore"
                  data-track-action="display_sider_open"
                  onClick={this.handleOpen}
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
export default connect(mapState, mapDispatch)(DisplayPanel);
