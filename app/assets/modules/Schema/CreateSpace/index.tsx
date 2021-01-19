import {
  Breadcrumb,
  Button,
  Collapse,
  Divider,
  Icon,
  Input,
  message,
  Modal,
  Select,
} from 'antd';
import Form, { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { Instruction } from '#assets/components';
import GQLCodeMirror from '#assets/components/GQLCodeMirror';
import {
  nameRulesFn,
  numberRulesFn,
  replicaRulesFn,
} from '#assets/config/rules';
import { IDispatch, IRootState } from '#assets/store';
import { getSpaceCreateGQL } from '#assets/utils/gql';
import { trackEvent, trackPageView } from '#assets/utils/stat';

import './index.less';

const Panel = Collapse.Panel;
const Option = Select.Option;
const confirm = Modal.confirm;

const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncCreateSpace,
  activeMachineNum: state.nebula.activeMachineNum,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpacesList: dispatch.nebula.asyncGetSpacesList,
  asyncCreateSpace: dispatch.nebula.asyncCreateSpace,
  asyncGetMatchineNumber: dispatch.nebula.asyncGetMatchineNumber,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps,
    RouteComponentProps {}

function getVidType(type: string, length?: string) {
  let result: string | undefined;
  if (type === 'INT64') {
    result = type;
  } else if (type === 'FIXED_STRING') {
    const _length = length || 8;
    result = type + '(' + _length + ')';
  }
  return result;
}
class CreateSpace extends React.Component<IProps> {
  componentDidMount() {
    trackPageView('/space/create');
    this.props.asyncGetMatchineNumber();
  }

  handleCreate = () => {
    this.props.form.validateFields(async err => {
      if (!err) {
        const {
          name,
          partitionNum,
          replicaFactor,
          charset,
          collate,
          vidType,
          stringLength,
        } = this.props.form.getFieldsValue();
        const _vidType = getVidType(vidType, stringLength);
        const options = {
          partition_num: partitionNum,
          replica_factor: replicaFactor,
          charset,
          collate,
          vid_type: _vidType,
        };
        const { code, message: errorMsg } = await this.props.asyncCreateSpace({
          name,
          options,
        });
        if (code === 0) {
          this.props.history.push('/schema');
          message.success(intl.get('schema.createSuccess'));
        } else {
          message.warning(errorMsg);
        }
        trackEvent(
          'schema',
          'create_space',
          code === '0' ? 'ajax_success' : 'ajax_fail',
        );
      }
    });
  };

  goBack = e => {
    e.preventDefault();
    const { history } = this.props;
    confirm({
      title: intl.get('schema.leavePage'),
      content: intl.get('schema.leavePagePrompt'),
      okText: intl.get('common.confirm'),
      cancelText: intl.get('common.cancel'),
      onOk() {
        trackEvent('navigation', 'view_schema', 'from_space_create_btn');
        history.push('/schema');
      },
    });
  };

  render() {
    const { loading, activeMachineNum } = this.props;
    const { getFieldDecorator, getFieldsValue } = this.props.form;
    const {
      name,
      partitionNum,
      replicaFactor,
      charset,
      collate,
      vidType,
      stringLength,
    } = getFieldsValue();
    const innerItemLayout = {
      labelCol: {
        span: 8,
      },
      wrapperCol: {
        span: 10,
      },
    };
    const outItemLayout = {
      labelCol: {
        span: 1,
      },
      wrapperCol: {
        span: 6,
      },
    };
    const _vidType = getVidType(vidType, stringLength);
    const options = {
      partition_num: partitionNum,
      replica_factor: replicaFactor,
      charset,
      collate,
      vid_type: _vidType,
    };
    const currentGQL = name
      ? getSpaceCreateGQL({
          name,
          options,
        })
      : '';
    return (
      <div className="nebula-space">
        <header>
          <Breadcrumb className="header-title">
            <Breadcrumb.Item>
              <a href="#" onClick={this.goBack}>
                {intl.get('schema.spaceList')}
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{intl.get('common.create')}</Breadcrumb.Item>
          </Breadcrumb>
          <Button onClick={this.goBack}>
            <Icon type="left" />
            {intl.get('schema.backToSpaceList')}
          </Button>
        </header>
        <Divider />
        <div className="space-form">
          <Form {...innerItemLayout}>
            <Form.Item label={intl.get('common.name')} {...outItemLayout}>
              {getFieldDecorator('name', {
                rules: nameRulesFn(intl),
              })(<Input />)}
            </Form.Item>
            <Collapse>
              <Panel header={intl.get('common.optionalParameters')} key="ngql">
                <Form.Item
                  label={
                    <>
                      <span>partition_num</span>
                      <Instruction
                        description={intl.get('schema.partitionNumDescription')}
                      />
                    </>
                  }
                >
                  {getFieldDecorator('partitionNum', {
                    rules: numberRulesFn(intl),
                  })(<Input placeholder="100" />)}
                </Form.Item>
                <Form.Item
                  label={
                    <>
                      <span>replica_factor</span>
                      <Instruction
                        description={intl.get(
                          'schema.replicaFactorDescription',
                        )}
                      />
                    </>
                  }
                >
                  {getFieldDecorator('replicaFactor', {
                    rules: replicaRulesFn(intl, activeMachineNum),
                  })(<Input placeholder="1" />)}
                </Form.Item>
                <Form.Item
                  label={
                    <>
                      <span>charset</span>
                      <Instruction
                        description={intl.get('schema.charsetDescription')}
                      />
                    </>
                  }
                >
                  {getFieldDecorator('charset')(
                    <Select placeholder="utf8">
                      <Option value="utf8">utf8</Option>
                    </Select>,
                  )}
                </Form.Item>
                <Form.Item
                  label={
                    <>
                      <span>collate</span>
                      <Instruction
                        description={intl.get('schema.collateDescription')}
                      />
                    </>
                  }
                >
                  {getFieldDecorator('collate')(
                    <Select placeholder="utf8_bin">
                      <Option value="utf8_bin">utf8_bin</Option>
                    </Select>,
                  )}
                </Form.Item>
                <Form.Item
                  label={
                    <>
                      <span>vid type</span>
                      <Instruction
                        description={intl.get('schema.vidTypeDescription')}
                      />
                    </>
                  }
                >
                  {getFieldDecorator('vidType')(
                    <Select
                      placeholder="FIXED_STRING"
                      className="select-vid-type"
                    >
                      <Option value="FIXED_STRING">FIXED_STRING</Option>
                      <Option value="INT64">INT64</Option>
                    </Select>,
                  )}
                  {vidType === 'FIXED_STRING' && (
                    <Form.Item className="item-string-length">
                      {getFieldDecorator('stringLength', {
                        rules: numberRulesFn(intl),
                      })(
                        <Input
                          className="input-string-length"
                          placeholder="8"
                        />,
                      )}
                    </Form.Item>
                  )}
                </Form.Item>
              </Panel>
            </Collapse>
          </Form>
          <GQLCodeMirror currentGQL={currentGQL} />
          <div className="btns">
            <Button
              type="primary"
              loading={!!loading}
              onClick={this.handleCreate}
            >
              <Icon type="plus" />
              {intl.get('common.create')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(mapState, mapDispatch)(Form.create<IProps>()(CreateSpace)),
);
