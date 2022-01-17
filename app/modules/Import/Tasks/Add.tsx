import { Button, Form, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#app/components';
import { IDispatch, IRootState } from '#app/store';

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
        const { fileName } = values;
        let file;
        files.forEach(_file => {
          if (_file.name === fileName) {
            file = _file;
          }
        });
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
    return (
      <div className={`add-${type}`}>
        <Button onClick={this.handleAdd}>
          + {intl.get('import.bindDatasource')}
        </Button>
        <Modal
          className="add-file-select"
          handlerRef={handle => (this.modalHandle = handle)}
          footer={false}
        >
          <Form>
            <FormItem label={intl.get('import.fileName')}>
              {getFieldDecorator('fileName', {
                rules: [
                  {
                    required: true,
                  },
                ],
              })(
                <Select showSearch={true}>
                  {files.map((file: any) => (
                    <Option value={file.name} key={file.name}>
                      {file.name}
                    </Option>
                  ))}
                </Select>,
              )}
            </FormItem>
            <Button onClick={this.handleSubmit}>
              {intl.get('import.confirm')}
            </Button>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Form.create()(Add));
