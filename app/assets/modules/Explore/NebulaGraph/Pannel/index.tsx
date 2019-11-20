import { Button } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

import { Modal } from '#assets/components';

import Expand from './Expand';
import './index.less';

export default class Panel extends React.Component {
  modalHandler;
  handleExpand = () => {
    if (this.modalHandler) {
      this.modalHandler.show();
    }
  };

  handleClose = () => {
    if (this.modalHandler) {
      this.modalHandler.hide();
    }
  };

  render() {
    return (
      <div className="panel">
        <Button onClick={this.handleExpand}>
          {intl.get('explore.expand')}
        </Button>
        <Modal
          handlerRef={handler => (this.modalHandler = handler)}
          width={800}
          footer={null}
        >
          <Expand close={this.handleClose} />
        </Modal>
      </div>
    );
  }
}
