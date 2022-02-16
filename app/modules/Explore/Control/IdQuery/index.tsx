import { Button, Form, Input, Spin, Upload } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { FormInstance } from 'antd/es/form';
import { nodeIdRulesFn } from '#app/config/rules';
import { IDispatch, IRootState } from '#app/store';
import readFileContent from '#app/utils/file';

import './index.less';

const { TextArea } = Input;
const mapState = (state: IRootState) => ({
  sampleLoading: !!state.loading.effects.explore.asyncGetSampleVertic,
});
const mapDispatch = (dispatch: IDispatch) => ({
  asyncImportNodes: dispatch.explore.asyncImportNodes,
  asyncGetSampleVertic: dispatch.explore.asyncGetSampleVertic,
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {
  closeHandler: any;
}

interface IState {
  loading: boolean;
}

class IdQuery extends React.Component<IProps, IState> {
  formRef = React.createRef<FormInstance>()
  constructor(props: IProps) {
    super(props);

    this.state = {
      loading: false,
    };
  }
  handleImport = data => {
    const { ids } = data;
    const _ids = ids.trim().split('\n');
    this.props.asyncImportNodes({ ids: _ids });
    this.props.closeHandler();
  };

  handleFileImport = async({ file }) => {
    this.setState({
      loading: true,
    });
    const ids = await readFileContent(file);
    this.setState({
      loading: false,
    });
    this.formRef.current!.setFieldsValue({
      ids,
    });
  };

  resetValidator = () => {
    const ids = this.formRef.current!.getFieldValue('ids');
    this.formRef.current!.resetFields(['ids']);
    this.formRef.current!.setFieldsValue({ ids });
  };

  handleImportSample = async() => {
    const { asyncGetSampleVertic, closeHandler } = this.props;
    const { code } = await asyncGetSampleVertic();
    if (code === 0) {
      closeHandler();
    }
  };
  render() {
    const { loading } = this.state;
    const { sampleLoading } = this.props;
    return (
      <Spin spinning={loading}>
        <div className="import-node">
          <div className="header">
            <span>{intl.get('explore.idToBeQueried')}</span>
            <div className="btn-upload">
              <Button onClick={this.handleImportSample} loading={sampleLoading}>
                {intl.get('explore.sampleImport')}
              </Button>
              <Upload
                beforeUpload={() => false}
                onChange={this.handleFileImport}
                showUploadList={false}
              >
                <Button>{intl.get('explore.fileImport')}</Button>
              </Upload>
            </div>
          </div>
          <Form layout="horizontal" ref={this.formRef} onFinish={this.handleImport}>
            <Form.Item name="ids" rules={nodeIdRulesFn(intl)}>
              <TextArea
                placeholder={intl.get('explore.importPlaceholder')}
                rows={12}
              />
            </Form.Item>
            <Form.Item className="btn-wrap">
              <Button
                type="primary"
                htmlType="submit"
                data-track-category="explore"
                data-track-action="query_by_id"
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

export default connect(mapState, mapDispatch)(IdQuery);
