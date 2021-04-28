import { Input, message } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import MenuButton from '#assets/components/Button';
import { IDispatch, IRootState } from '#assets/store';
import { INode } from '#assets/utils/interface';
interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
}
const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSelectIds: (vertexes: INode[]) => {
    dispatch.explore.update({
      selectVertexes: vertexes,
    });
  },
});
class SearchBtn extends React.PureComponent<IProps> {
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

  getFieldValue = (node, field) => {
    let nodeValue = null as any;
    if (field === 'vid') {
      return node.name;
    }
    const properties = node.nodeProp.properties;
    Object.keys(properties).some(property => {
      const value = properties[property];
      return Object.keys(value).some(nodeField => {
        const fieldStr = property + '.' + nodeField;
        if (fieldStr === field) {
          nodeValue = value[nodeField];
        }
      });
    });
    return nodeValue;
  };

  handleSearchNodes = value => {
    const { vertexes, updateSelectIds } = this.props;
    const selectVertexes = [];
    const reg = /([a-zA-Z0-9_.]*)\s*([\=\>\<\!]+)\s*(.*)/g;
    const searchInfo = reg.exec(value) || [];
    if (searchInfo.length > 0) {
      const key = searchInfo[1];
      const compare = searchInfo[2];
      const result = searchInfo[3];
      if (compare) {
        vertexes.forEach(vertex => {
          const fieldValue = this.getFieldValue(vertex, key);
          const strReg = /^['|"].*['|"]$/;
          switch (compare) {
            case '=':
              if (
                strReg.test(result) &&
                fieldValue === result.slice(1, result.length - 1)
              ) {
                selectVertexes.push(vertex);
              } else if (fieldValue && fieldValue.toString() === result) {
                selectVertexes.push(vertex);
              }
              break;
            case '>':
              if (fieldValue > result) {
                selectVertexes.push(vertex);
              }
              break;
            case '<':
              if (fieldValue < result) {
                selectVertexes.push(vertex);
              }
              break;
            case '<=':
              if (fieldValue <= result) {
                selectVertexes.push(vertex);
              }
              break;
            case '>=':
              if (fieldValue >= result) {
                selectVertexes.push(vertex);
              }
              break;
            case '<>':
            case '!=':
              if (
                strReg.test(result) &&
                fieldValue !== result.slice(1, result.length - 1)
              ) {
                selectVertexes.push(vertex);
              } else if (
                !strReg.test(result) &&
                fieldValue &&
                fieldValue.toString() !== result
              ) {
                selectVertexes.push(vertex);
              }
              break;
            default:
              break;
          }
        });
      }
    } else {
      return message.warning(intl.get('explore.expressionError'));
    }
    if (selectVertexes.length !== 0) {
      updateSelectIds(selectVertexes);
      this.handleClose();
    } else {
      message.warning(intl.get('explore.searchEmpty'));
    }
  };
  render() {
    const { showTitle } = this.props;
    return (
      <>
        <MenuButton
          tips={!showTitle ? intl.get('common.search') : undefined}
          iconfont="iconstudio-search"
          title={showTitle ? intl.get('common.search') : undefined}
          trackCategory="explore"
          trackAction="node_search"
          trackLabel="from_panel"
          action={this.handleOpenModal}
        />
        <Modal
          width="700px"
          handlerRef={handler => (this.modalHandler = handler)}
          title={intl.get('explore.nodeSearch')}
          footer={null}
        >
          <Input.Search
            placeholder="person.name > xx"
            onSearch={this.handleSearchNodes}
          />
        </Modal>
      </>
    );
  }
}
export default connect(mapState, mapDispatch)(SearchBtn);
