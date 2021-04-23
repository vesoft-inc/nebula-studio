import { Button, message } from 'antd';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import intl from 'react-intl-universal';

import { CodeMirror } from '#assets/components';

import { Modal } from '..';
import './index.less';
interface IModalHandler {
  show: (callback?: any) => void;
}

interface IProps {
  gql: string;
  handlerRef?: (handler: IModalHandler) => void;
}

class GQLModal extends React.PureComponent<IProps> {
  modalHandler;
  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        show: this.show,
      });
    }
  }

  show = () => {
    if (this.modalHandler) {
      this.modalHandler.show();
    }
  };

  handleCopy = () => {
    message.success(intl.get('common.copySuccess'));
  };

  render() {
    const { gql } = this.props;
    return (
      <Modal
        className="modal-gql"
        title={intl.get('common.exportNGQL')}
        handlerRef={handler => {
          this.modalHandler = handler;
        }}
        footer={false}
        width={700}
      >
        <CodeMirror value={gql} />
        <div className="footer">
          <CopyToClipboard text={gql} onCopy={this.handleCopy}>
            <Button type="primary">{intl.get('common.copy')}</Button>
          </CopyToClipboard>
        </div>
      </Modal>
    );
  }
}

export default GQLModal;
