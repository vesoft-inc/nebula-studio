import React, { Fragment } from 'react';

import DeleteBtn from './Delete';
import ExpandBtn from './Expand';
import HotkeysDescBtn from './HotKeysDescription';
import './index.less';
import Lock from './Lock';
import MoveBtn from './Move';
import PropsDisplayBtn from './PropsDisplay';
import RollbackBtn from './Rollback';
import SearchBtn from './Search';
import UnExpandBtn from './UnExpandBtn';
import Unlock from './Unlock';
import VertexStyleSetBtn from './VertexStyleSetBtn';
import ZoomBtn from './Zoom';

interface IProps {
  toolTipRef;
}

class Panel extends React.PureComponent<IProps> {
  modalHandler;
  zoomInBtn;
  zoomOutBtn;
  displayBtn;
  rollbackBtn;
  deleteBtn;
  expandBtn;
  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }
  onKeyDown = e => {
    switch (true) {
      case e.keyCode === 13 && e.shiftKey:
        this.expandBtn.onKeydown();
        break;
      case e.keyCode === 189 && e.shiftKey:
        // shift + '-' zoom out
        this.zoomOutBtn.onKeydown();
        break;
      case e.keyCode === 187 && e.shiftKey:
        // shift + '+' zoom in
        this.zoomInBtn.onKeydown();
        break;
      case e.keyCode === 76 && e.shiftKey:
        // shift + l open show modal
        this.displayBtn.onKeydown();
        break;
      case e.keyCode === 90 && e.shiftKey:
        // shift + z rollback
        this.rollbackBtn.onKeydown();
        break;
      case e.keyCode === 8 && e.shiftKey:
        // shift + del delete
        this.deleteBtn.onKeydown();
        break;
      default:
        break;
    }
  };

  render() {
    const menuConfig = [
      [
        {
          component: <ExpandBtn handlerRef={btn => (this.expandBtn = btn)} />,
        },
        {
          component: <UnExpandBtn />,
        },
      ],
      [
        {
          component: (
            <ZoomBtn
              type="zoom-in"
              handlerRef={btn => (this.zoomInBtn = btn)}
            />
          ),
        },
        {
          component: (
            <ZoomBtn
              type="zoom-out"
              handlerRef={btn => (this.zoomOutBtn = btn)}
            />
          ),
        },
        {
          component: <MoveBtn />,
        },
      ],
      [
        {
          component: <VertexStyleSetBtn />,
        },
        {
          component: (
            <PropsDisplayBtn handlerRef={btn => (this.displayBtn = btn)} />
          ),
        },
      ],
      [
        {
          component: <Lock />,
        },
        {
          component: <Unlock />,
        },
      ],
      [
        {
          component: (
            <RollbackBtn handlerRef={btn => (this.rollbackBtn = btn)} />
          ),
        },
        {
          component: (
            <DeleteBtn
              handlerRef={btn => (this.deleteBtn = btn)}
              toolTipRef={this.props.toolTipRef}
            />
          ),
        },
      ],
      [
        {
          component: <HotkeysDescBtn />,
        },
        {
          component: <SearchBtn />,
        },
      ],
    ];
    return (
      <div className="panel">
        {menuConfig.map((group, i) => (
          <div className="panel-group" key={i}>
            {group.map((item, index) => (
              <Fragment key={index}>{item.component}</Fragment>
            ))}
          </div>
        ))}
      </div>
    );
  }
}
export default Panel;
