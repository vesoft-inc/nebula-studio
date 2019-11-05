import { Modal as AntModal } from 'antd';
import { ModalProps } from 'antd/lib/modal';
import React, { Component } from 'react';

interface IModalState {
  visible: boolean;
}

interface IModalHandler {
  show: (callback?: any) => void;
  hide: (callback?: any) => void;
}

interface IModalProps extends ModalProps {
  /**
   * use this hook you can get the handler of Modal
   * handlerRef => ({ visible, show, hide })
   */
  handlerRef?: (handler: IModalHandler) => void;
  children?: any;
}
export default class Modal extends Component<IModalProps, IModalState> {
  constructor(props: IModalProps) {
    super(props);
    this.state = {
      visible: false,
    };
  }
  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        show: this.show,
        hide: this.hide,
      });
    }
  }

  show = (callback?: any) => {
    this.setState(
      {
        visible: true,
      },
      () => {
        if (callback) {
          callback();
        }
      },
    );
  };

  hide = (callback?: any) => {
    this.setState(
      {
        visible: false,
      },
      () => {
        if (callback) {
          callback();
        }
      },
    );
  };

  render() {
    return (
      this.state.visible && (
        <AntModal
          visible={true}
          onCancel={() => {
            this.hide();
          }}
          {...this.props}
        >
          {this.props.children}
        </AntModal>
      )
    );
  }
}
