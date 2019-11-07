import { Button, Form, Input, Upload } from 'antd';
import { FormComponentProps } from 'antd/lib/form/Form';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { nodeIdRulesFn } from '#assets/config/rules';
import { IDispatch, IRootState } from '#assets/store';
import readFileContent from '#assets/utils/file';

import './ImportNode.less';

const TextArea = Input.TextArea;

const mapState = (state: IRootState) => ({
  nodes: state.explore.nodes,
});
const mapDispatch = (dispatch: IDispatch) => ({
  updateNodes: nodes => {
    dispatch.explore.update({
      nodes,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {
  handler: any;
}

class ImportNodes extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  handleImport = () => {
    this.props.form.validateFields((err, data) => {
      if (!err) {
        const { nodes } = this.props;
        const { ids } = data;
        this.props.updateNodes(
          _.uniqBy(
            [
              ...nodes,
              ids
                .trim()
                .split('\n')
                .map(id => ({
                  name: id,
                  group: 1,
                })),
            ],
            'name',
          ),
        );

        this.props.handler.hide();
      }
    });
  };

  handleFileImport = async ({ file }) => {
    const ids = await readFileContent(file);
    this.props.form.setFieldsValue({
      ids,
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <div className="import-node">
        <h3>{intl.get('explore.importNode')}</h3>
        <Form>
          <Form.Item>
            {getFieldDecorator('ids', {
              rules: nodeIdRulesFn(intl),
            })(
              <TextArea
                placeholder={intl.get('explore.importPlaceholder')}
                rows={20}
              />,
            )}
          </Form.Item>
          <Form.Item className="btn-wrap">
            {/* <Input type="file" onChange={this.handleFileImport} id="ids-file"></Input> */}
            <Upload
              beforeUpload={() => false}
              onChange={this.handleFileImport}
              showUploadList={false}
            >
              <Button>{intl.get('explore.fileImport')}</Button>
            </Upload>
            <Button type="primary" onClick={this.handleImport}>
              {intl.get('explore.import')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Form.create<IProps>()(ImportNodes));
