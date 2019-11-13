import { Button, Form, Input, Spin, Upload } from 'antd';
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
  vertexs: state.explore.vertexs,
});
const mapDispatch = (dispatch: IDispatch) => ({
  updateNodes: vertexs => {
    dispatch.explore.update({
      vertexs,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {
  handler: any;
}

interface IState {
  loading: boolean;
}

class ImportNodes extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      loading: false,
    };
  }

  handleImport = () => {
    this.props.form.validateFields((err, data) => {
      if (!err) {
        const { vertexs } = this.props;
        const { ids } = data;
        this.props.updateNodes(
          _.uniqBy(
            [
              ...vertexs,
              ...ids
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
    this.setState({
      loading: true,
    });
    const ids = await readFileContent(file);
    this.setState({
      loading: false,
    });
    this.props.form.setFieldsValue({
      ids,
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { loading } = this.state;

    return (
      <Spin spinning={loading}>
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
      </Spin>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Form.create<IProps>()(ImportNodes));
