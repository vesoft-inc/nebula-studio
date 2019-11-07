import { Button } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

import { Modal } from '#assets/components';

import Expand from './Expand';
import './index.less';

export default class Panel extends React.Component {
  modalHandler;
  handlerExpand = () => {
    if (this.modalHandler) {
      this.modalHandler.show();
    }
  };

  render() {
    return (
      <div className="panel">
        <Button onClick={this.handlerExpand}>
          {intl.get('explore.expand')}
        </Button>
        <Modal
          handlerRef={handler => (this.modalHandler = handler)}
          width={800}
          footer={null}
        >
          <Expand />
        </Modal>
      </div>
    );
  }
}
