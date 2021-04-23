import { Table } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';

import { Modal } from '#assets/components';
import MenuButton from '#assets/components/Button';
import { HOT_KEYS } from '#assets/config/explore';
class HotKeysDesc extends React.PureComponent {
  modalHandler;
  handleOpenModal = () => {
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
    const columns = [
      {
        title: intl.get('common.operation'),
        dataIndex: 'operation',
        align: 'center' as const,
        width: '50%',
      },
      {
        title: intl.get('common.description'),
        dataIndex: 'desc',
        align: 'center' as const,
      },
    ];
    return (
      <>
        <MenuButton
          tips={intl.get('common.hotKeys')}
          iconfont="iconstudio-hotkey"
          action={this.handleOpenModal}
        />
        <Modal
          width="700px"
          handlerRef={handler => (this.modalHandler = handler)}
          title={intl.get('explore.hotKeysInstructions')}
          footer={
            <a
              className="btn-git"
              href="https://github.com/vesoft-inc/nebula-web-docker/issues"
              target="_blank"
            >
              {intl.get('common.moreSuggestion')}
            </a>
          }
        >
          <Table
            dataSource={HOT_KEYS(intl)}
            columns={columns}
            rowKey={(_, index) => index.toString()}
            pagination={false}
          />
        </Modal>
      </>
    );
  }
}
export default HotKeysDesc;
