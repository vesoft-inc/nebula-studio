import { Button, Form, Icon, Input, Select, Spin, Tooltip, Upload } from 'antd';
import { FormComponentProps } from 'antd/lib/form/Form';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { nodeIdRulesFn } from '#assets/config/rules';
import { LanguageContext } from '#assets/context';
import { IDispatch } from '#assets/store';
import readFileContent from '#assets/utils/file';
import { trackEvent } from '#assets/utils/stat';

import './IdQuery.less';

const { TextArea } = Input;
const Option = Select.Option;
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
  static contextType = LanguageContext;
  constructor(props: IProps) {
    super(props);

    this.state = {
      loading: false,
    };
  }
  handleImport = () => {
    trackEvent('explore', 'query_by_id');
    this.props.form.validateFields(async (err, data) => {
      if (!err) {
        const { ids, useHash } = data;
        const _ids = ids.trim().split('\n');
        this.props.asyncImportNodes({ ids: _ids, useHash });
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
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { loading } = this.state;
    const itemLayout = {
      labelCol: {
        span: this.context && this.context.currentLocale === 'EN_US' ? 8 : 4,
      },
      wrapperCol: { span: 6 },
    };
    const useHash = getFieldValue('useHash');
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
                rules:
                  useHash === 'unset'
                    ? nodeIdRulesFn(intl)
                    : [
                        {
                          required: true,
                          message: intl.get('formRules.idRequired'),
                        },
                      ],
              })(
                <TextArea
                  placeholder={intl.get('explore.importPlaceholder')}
                  rows={12}
                />,
              )}
            </Form.Item>
            <Form.Item
              label={
                <>
                  {intl.get('explore.idPretreatment')}
                  <Tooltip
                    title={intl.get('explore.pretreatmentExplaination')}
                    placement="right"
                  >
                    <Icon type="question-circle" />
                  </Tooltip>
                </>
              }
              labelAlign="left"
              {...itemLayout}
            >
              {getFieldDecorator('useHash', {
                initialValue: 'unset',
              })(
                <Select onChange={this.resetValidator}>
                  <Option value="unset">{intl.get('import.unset')}</Option>
                  <Option value="uuid">{intl.get('import.uuid')}</Option>
                  <Option value="hash">{intl.get('import.hash')}</Option>
                </Select>,
              )}
            </Form.Item>
            <Form.Item className="btn-wrap">
              <Button type="primary" onClick={this.handleImport}>
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
