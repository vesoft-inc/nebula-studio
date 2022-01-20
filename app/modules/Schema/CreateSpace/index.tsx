import {
  Breadcrumb,
  Button,
  Collapse,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  message
} from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { LeftOutlined, PlusOutlined } from '@ant-design/icons';

import { FormInstance } from 'antd/es/form';
import { Instruction } from '#app/components';
import GQLCodeMirror from '#app/components/GQLCodeMirror';
import { nameRulesFn, numberRulesFn, replicaRulesFn } from '#app/config/rules';
import { IDispatch, IRootState } from '#app/store';
import { getSpaceCreateGQL } from '#app/utils/gql';
import { trackEvent, trackPageView } from '#app/utils/stat';

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
  asyncGetMachineNumber: dispatch.nebula.asyncGetMachineNumber,
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch>,
  RouteComponentProps {}

function getVidType(type: string, length?: string) {
  let result;
  if (type === 'INT64') {
    result = type;
  } else if (type === 'FIXED_STRING') {
    result = type + '(' + (length || '') + ')';
  }
  return result;
}
class CreateSpace extends React.Component<IProps> {
  formRef = React.createRef<FormInstance>()
  componentDidMount() {
    trackPageView('/space/create');
    this.props.asyncGetMachineNumber();
  }

  handleCreate = () => {
    this.formRef.current!.validateFields().then(async() => {
      const {
        name,
        partitionNum,
        replicaFactor,
        vidType,
        stringLength,
        comment,
      } = this.formRef.current!.getFieldsValue();
      const _vidType = getVidType(vidType, stringLength);
      const options = {
        partition_num: partitionNum,
        replica_factor: replicaFactor,
        vid_type: _vidType,
      };
      const { code, message: errorMsg } = await this.props.asyncCreateSpace({
        name,
        options,
        comment,
      });
      if (code === 0) {
        this.props.history.push('/schema');
        message.success(intl.get('schema.createSuccess'));
      } else {
        message.warning(errorMsg);
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
    const { getFieldsValue } = this.formRef.current!;
    const {
      name,
      partitionNum,
      replicaFactor,
      vidType,
      stringLength,
      comment,
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
        span: 2,
      },
      wrapperCol: {
        span: 7,
      },
    };
    const _vidType = getVidType(vidType, stringLength);
    const options = {
      partition_num: partitionNum,
      replica_factor: replicaFactor,
      vid_type: _vidType,
    };
    const currentGQL = name
      ? getSpaceCreateGQL({
        name,
        options,
        comment,
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
            <LeftOutlined />
            {intl.get('schema.backToSpaceList')}
          </Button>
        </header>
        <Divider />
        <div className="space-form">
          <Form {...innerItemLayout} ref={this.formRef}>
            <Form.Item label={intl.get('common.name')} {...outItemLayout} name="name" rules={nameRulesFn(intl)}>
              <Input />
            </Form.Item>
            <Form.Item
              {...outItemLayout}
              label={
                <>
                  <span>vid type</span>
                  <Instruction
                    description={intl.get('schema.vidTypeDescription')}
                  />
                </>
              }
              name="vidType"
              rules={[{ required: true }]}
            >
              <Select placeholder="FIXED_STRING" className="select-vid-type">
                <Option value="FIXED_STRING">FIXED_STRING</Option>
                <Option value="INT64">INT64</Option>
              </Select>
              {vidType === 'FIXED_STRING' && (
                <Form.Item className="item-string-length" name="stringLength" rules={[
                  {
                    required: true,
                    message: 'fix string length limit is required',
                  },
                  ...numberRulesFn(intl),
                ]}>
                  <Input />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item label={intl.get('common.comment')} {...outItemLayout} name="comment">
              <Input />
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
                  name="partitionNum"
                  rules={numberRulesFn(intl)}
                >
                  <Input placeholder="100" />
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
                  name="replicaFactor"
                  rules={replicaRulesFn(intl, activeMachineNum)}
                >
                  <Input placeholder="1" />
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
              <PlusOutlined />
              {intl.get('common.create')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(mapState, mapDispatch)(CreateSpace),
);
