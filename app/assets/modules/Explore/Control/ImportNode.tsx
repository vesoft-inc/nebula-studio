import { Button, Form, Input, Spin, Upload } from 'antd';
import { FormComponentProps } from 'antd/lib/form/Form';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { nodeIdRulesFn } from '#assets/config/rules';
import { IDispatch, IRootState } from '#assets/store';
import { fetchVertexId } from '#assets/utils/fetch';
import readFileContent from '#assets/utils/file';

import './ImportNode.less';

const TextArea = Input.TextArea;

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
  space: state.nebula.currentSpace,
});
const mapDispatch = (dispatch: IDispatch) => ({
  updateNodes: vertexes => {
    dispatch.explore.addNodesAndEdges({
      vertexes,
      edges: [],
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
    const { space, host, username, password } = this.props;
    this.props.form.validateFields(async (err, data) => {
      if (!err) {
        const { ids } = data;
        this.props.updateNodes([
          ...(await Promise.all(
            ids
              .trim()
              .split('\n')
              .map(async id => ({
                name: id,
                group: 0,
                nodeProp: await fetchVertexId(
                  { space, host, username, password },
                  id,
                ),
              })),
          )),
        ]);
      }
      this.props.handler.hide();
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
                {intl.get('explore.addConfirm')}
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
