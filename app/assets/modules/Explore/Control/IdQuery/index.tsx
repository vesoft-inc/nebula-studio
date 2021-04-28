import { Button, Form, Input, Spin, Upload } from 'antd';
import { FormComponentProps } from 'antd/lib/form/Form';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { nodeIdRulesFn } from '#assets/config/rules';
import { IDispatch } from '#assets/store';
import readFileContent from '#assets/utils/file';

import './index.less';

const { TextArea } = Input;
const mapState = () => ({});
const mapDispatch = (dispatch: IDispatch) => ({
  asyncImportNodes: dispatch.explore.asyncImportNodes,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {
  closeHandler: any;
}

interface IState {
  loading: boolean;
}

class IdQuery extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      loading: false,
    };
  }
  handleImport = () => {
    this.props.form.validateFields(async (err, data) => {
      if (!err) {
        const { ids } = data;
        const _ids = ids.trim().split('\n');
        this.props.asyncImportNodes({ ids: _ids });
        this.props.closeHandler();
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

  resetValidator = () => {
    const ids = this.props.form.getFieldValue('ids');
    this.props.form.resetFields(['ids']);
    this.props.form.setFieldsValue({ ids });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { loading } = this.state;
    return (
      <Spin spinning={loading}>
        <div className="import-node">
          <div className="header">
            <span>{intl.get('explore.idToBeQueried')}</span>
            <div className="btn-upload">
              <Upload
                beforeUpload={() => false}
                onChange={this.handleFileImport}
                showUploadList={false}
              >
                <Button>{intl.get('explore.fileImport')}</Button>
              </Upload>
            </div>
          </div>
          <Form layout="horizontal">
            <Form.Item>
              {getFieldDecorator('ids', {
                rules: nodeIdRulesFn(intl),
              })(
                <TextArea
                  placeholder={intl.get('explore.importPlaceholder')}
                  rows={12}
                />,
              )}
            </Form.Item>
            <Form.Item className="btn-wrap">
              <Button
                type="primary"
                data-track-category="explore"
                data-track-action="query_by_id"
                onClick={this.handleImport}
              >
                {intl.get('explore.addConfirm')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Spin>
    );
  }
}

export default connect(mapState, mapDispatch)(Form.create<IProps>()(IdQuery));
