import { Button, Form, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import './Add.less';

const mapState = (state: IRootState) => ({
  files: state.importData.files,
});

const mapDispatch = (dispatch: IDispatch) => ({
  newVertexConfig: file => {
    dispatch.importData.newVertexConfig({ file });
  },
  newEdgeConfig: file => {
    dispatch.importData.newEdgeConfig({ file });
  },
});

export enum AddType {
  vertex = 'vertex',
  edge = 'edge',
}

const Option = Select.Option;

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {
  type: AddType;
}
const FormItem = Form.Item;

class Add extends React.PureComponent<IProps> {
  modalHandle;

  handleSubmit = () => {
    const { type, files } = this.props;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const { fileIndex } = values;
        const file = files.filter(f => f.dataType === type)[fileIndex];
        if (type === AddType.vertex) {
          this.props.newVertexConfig(file);
          this.modalHandle.hide();
        } else {
          this.props.newEdgeConfig(file);
          this.modalHandle.hide();
        }
      }
    });
  };

  handleAdd = () => {
    if (this.modalHandle) {
      this.modalHandle.show();
    }
  };

  render() {
    const {
      type,
      files,
      form: { getFieldDecorator },
    } = this.props;
    const addText =
      type === AddType.vertex
        ? intl.get('import.addVertex')
        : intl.get('import.addEdge');

    return (
      <div className={`add-${type}`}>
        <Button onClick={this.handleAdd}>{addText}</Button>
        <Modal
          className="add-file-select"
          handlerRef={handle => (this.modalHandle = handle)}
          footer={false}
        >
          <Form>
            <FormItem label={intl.get('import.fileName')}>
              {getFieldDecorator('fileIndex', {
                rules: [
                  {
                    required: true,
                  },
                ],
              })(
                <Select>
                  {files
                    .filter(file => file.dataType === type)
                    .map((file, index) => (
                      <Option value={index} key={file.name}>
                        {file.name}
                      </Option>
                    ))}
                </Select>,
              )}
            </FormItem>
            <Button onClick={this.handleSubmit}>{addText}</Button>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Form.create()(Add));
