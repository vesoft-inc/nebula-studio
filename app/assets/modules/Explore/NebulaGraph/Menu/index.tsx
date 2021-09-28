import * as d3 from 'd3';
import React, { Fragment } from 'react';

import DeleteBtn from '../Panel/Delete';
import ExpandBtn from '../Panel/Expand';
import Lock from '../Panel/Lock';
import PropsDisplayBtn from '../Panel/PropsDisplay';
import RollbackBtn from '../Panel/Rollback';
import SearchBtn from '../Panel/Search';
import UnExpandBtn from '../Panel/UnExpandBtn';
import Unlock from '../Panel/Unlock';
import VertexSet from '../Panel/VertexSet';
import ZoomBtn from '../Panel/Zoom';
import './index.less';

interface IProps {
  width: number;
  height: number;
}
class Menu extends React.PureComponent<IProps> {
  componentDidMount() {
    const self = this;
    d3.select('#output-graph')
      .on('contextmenu', () => {
        self.renderRightMenu(d3.event);
        d3.event.preventDefault();
      })
      .on('click', () => {
        d3.select('.d3-click-right-menu').style('visibility', 'hidden');
      });

    d3.selectAll('.panel-btn-item').on('click', () => {
      d3.select('.d3-click-right-menu').style('visibility', 'hidden');
    });
  }

  renderRightMenu = event => {
    const { width, height } = this.props;
    const $rightMenu = d3.select('.d3-click-right-menu');
    // Do this in order to get width && height
    $rightMenu.style('visibility', 'hidden');
    if ($rightMenu) {
      const {
        width: menuWidth,
        height: menuHeight,
      } = ($rightMenu.node() as HTMLElement).getBoundingClientRect();
      let left = event.offsetX;
      let top = event.offsetY;
      if (left + menuWidth > width) {
        left = left - menuWidth;
      }
      if (menuHeight + top > height) {
        top = top - menuHeight;
      }
      $rightMenu
        .style('left', left + 'px')
        .style('top', top + 'px')
        .style('visibility', 'visible');
    }
  };

  render() {
    const menuConfig = [
      {
        component: <ExpandBtn showTitle={true} />,
      },
      {
        component: <UnExpandBtn showTitle={true} />,
      },
      {
        component: <ZoomBtn type="zoom-in" showTitle={true} />,
      },
      {
        component: <ZoomBtn type="zoom-out" showTitle={true} />,
      },
      {
        component: <VertexSet showTitle={true} showIcon={true} />,
      },
      {
        component: <PropsDisplayBtn showTitle={true} />,
      },
      {
        component: <Unlock showTitle={true} />,
      },
      {
        component: <Lock showTitle={true} />,
      },
      {
        component: <RollbackBtn showTitle={true} />,
      },
      {
        component: <DeleteBtn showTitle={true} />,
      },
      {
        component: <SearchBtn showTitle={true} />,
      },
    ];
    return (
      <div className="d3-click-right-menu">
        {menuConfig.map((item, index) => (
          <Fragment key={index}>{item.component}</Fragment>
        ))}
      </div>
    );
  }
}
export default Menu;
