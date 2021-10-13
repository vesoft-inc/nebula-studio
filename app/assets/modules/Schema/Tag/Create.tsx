import {
  Breadcrumb,
  Button,
  Checkbox,
  Col,
  Collapse,
  Icon,
  Input,
  message,
  Modal,
  Popover,
  Row,
  Select,
} from 'antd';
import Form, { FormComponentProps } from 'antd/lib/form';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { match, RouteComponentProps, withRouter } from 'react-router-dom';

import GQLCodeMirror from '#assets/components/GQLCodeMirror';
import { nameRulesFn, numberRulesFn } from '#assets/config/rules';
import { IDispatch, IRootState } from '#assets/store';
import { dataType } from '#assets/utils/constant';
import { getTagOrEdgeCreateGQL } from '#assets/utils/gql';
import { trackEvent, trackPageView } from '#assets/utils/stat';

import './Create.less';

const Panel = Collapse.Panel;
const Option = Select.Option;
const confirm = Modal.confirm;

let id = 1;

const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncCreateTag,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncCreateTag: dispatch.nebula.asyncCreateTag,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps,
    RouteComponentProps {
  match: match<{ space: string }>;
}

interface IState {
  fieldRequired: boolean;
  ttlRequired: boolean;
}

class CreateTag extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      fieldRequired: false,
      ttlRequired: false,
    };
  }

  componentDidMount() {
    trackPageView('/schema/config/tag/create');
  }

  handleAddProperty = async () => {
    const { form } = this.props;
    const keys = form.getFieldValue('keys');
    const nextKeys = keys.concat(id++);
    await form.setFieldsValue({
      keys: nextKeys,
    });
  };

  handleDeleteField = (index: number) => {
    const { form } = this.props;
    const keys = form.getFieldValue('keys');
    const fields = form.getFieldValue('fields');
    if (keys.length === 1) {
      return;
    }
    form.setFieldsValue(
      {
        keys: keys.filter((_, i) => i !== index),
        fields: fields.filter((_, i) => i !== index),
      },
      () => {
        this.forceUpdate();
      },
    );
  };

  handleTogglePanels = async (e: string | string[], type: string) => {
    const { setFieldsValue } = this.props.form;
    const self = this;
    const key = `${type}Required`;
    if (e.length > 0) {
      await self.setState({
        [key]: true,
      } as Pick<IState, keyof IState>);
    } else {
      confirm({
        title: intl.get('schema.cancelOperation'),
        content: intl.get('schema.cancelPropmt'),
        okText: intl.get('common.yes'),
        cancelText: intl.get('common.no'),
        onOk: async () => {
          await self.setState({
            [key]: false,
          } as Pick<IState, keyof IState>);
          if (type === 'field') {
            // reset form
            id = 1;
            await setFieldsValue({
              keys: [0],
            });
          } else {
            await setFieldsValue({
              ttl: undefined,
            });
          }
        },
      });
    }
  };

  renderFields = () => {
    const { fieldRequired } = this.state;
    const { getFieldDecorator, getFieldsValue } = this.props.form;
    getFieldDecorator('keys', { initialValue: [0] });
    const form = getFieldsValue();
    const { keys, fields } = form;
    const itemLayout = {
      label: ' ',
      colon: false,
      labelCol: {
        span: 6,
      },
      wrapperCol: {
        span: 12,
      },
    };
    if (fieldRequired) {
      const formItems = keys.map((_, k: number) => (
        <div key={k} className="form-item">
          <Col span={4}>
            <Form.Item {...itemLayout}>
              {getFieldDecorator(`fields[${k}].name`, {
                rules: nameRulesFn(intl),
                initialValue: '',
              })(
                <Input placeholder={intl.get('formRules.propertyRequired')} />,
              )}
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item {...itemLayout} wrapperCol={{ span: 18 }}>
              {getFieldDecorator(`fields[${k}].type`, {
                initialValue: '',
                rules: [
                  {
                    required: true,
                    message: intl.get('formRules.dataTypeRequired'),
                  },
                ],
              })(
                <Select className="select-type">
                  {dataType.map(item => {
                    return (
                      <Option value={item.value} key={item.value}>
                        {item.label}
                      </Option>
                    );
                  })}
                </Select>,
              )}
              {fields && fields[k] && fields[k].type === 'fixed_string' && (
                <Form.Item className="item-string-length">
                  {getFieldDecorator(`fields[${k}].fixedLength`, {
                    rules: [
                      ...numberRulesFn(intl),
                      {
                        required: true,
                        message: intl.get('formRules.numberRequired'),
                      },
                    ],
                  })(<Input className="input-string-length" />)}
                </Form.Item>
              )}
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item {...itemLayout} className="center">
              {getFieldDecorator(`fields[${k}].allowNull`, {
                valuePropName: 'checked',
                initialValue: true,
              })(<Checkbox />)}
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item {...itemLayout}>
              {fields &&
              fields[k] &&
              ['date', 'time', 'datetime', 'timestamp'].includes(
                fields[k].type,
              ) ? (
                <Popover
                  trigger="focus"
                  placement="right"
                  content={intl.getHTML(`schema.${fields[k].type}Format`)}
                >
                  {getFieldDecorator(`fields[${k}].value`, {
                    initialValue: '',
                  })(
                    <Input
                      placeholder={intl.get('formRules.defaultRequired')}
                    />,
                  )}
                </Popover>
              ) : (
                <>
                  {getFieldDecorator(`fields[${k}].value`, {
                    initialValue: '',
                  })(
                    <Input
                      placeholder={intl.get('formRules.defaultRequired')}
                    />,
                  )}
                </>
              )}
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item {...itemLayout}>
              {getFieldDecorator(`fields[${k}].comment`)(<Input />)}
            </Form.Item>
          </Col>
          <Col span={2}>
            {keys.length > 1 && (
              <Icon
                className="delete-button"
                type="minus-circle-o"
                onClick={() => this.handleDeleteField(k)}
              />
            )}
          </Col>
        </div>
      ));
      return formItems;
    } else {
      return null;
    }
  };

  renderTtlConfig = () => {
    const { ttlRequired } = this.state;
    const { getFieldDecorator, getFieldsValue } = this.props.form;
    const innerItemLayout = {
      labelCol: {
        span: 8,
      },
      wrapperCol: {
        span: 9,
      },
    };
    const fields = getFieldsValue().fields ? getFieldsValue().fields : [];
    const ttlOptions = fields.filter(i =>
      ['int', 'int64', 'timestamp'].includes(i.type),
    );
    if (ttlRequired) {
      return (
        <>
          <Col span={12}>
            <Form.Item label="TTL_COL" {...innerItemLayout}>
              {getFieldDecorator('ttl.ttl_col', {
                rules: [
                  {
                    required: true,
                    message: intl.get('formRules.ttlRequired'),
                  },
                ],
              })(
                <Select>
                  {ttlOptions.map(i => (
                    <Option value={i.name} key={i.name}>
                      {i.name}
                    </Option>
                  ))}
                </Select>,
              )}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="TTL_DURATION" {...innerItemLayout}>
              {getFieldDecorator('ttl.ttl_duration', {
                rules: [
                  {
                    required: true,
                    message: intl.get('formRules.ttlDurationRequired'),
                  },
                  {
                    message: intl.get('formRules.positiveIntegerRequired'),
                    pattern: /^\d+$/,
                    transform(value) {
                      if (value) {
                        return Number(value);
                      }
                    },
                  },
                ],
              })(
                <Input
                  placeholder={intl.get('formRules.ttlDurationRequired')}
                />,
              )}
            </Form.Item>
          </Col>
        </>
      );
    } else {
      return null;
    }
  };

  handleCreate = () => {
    const { getFieldsValue } = this.props.form;
    const { match } = this.props;
    const {
      params: { space },
    } = match;
    this.props.form.validateFields(err => {
      const form = getFieldsValue();
      if (!err) {
        const { name, fields, ttl: ttlConfig, comment } = form;
        const uniqFields = _.uniqBy(fields, 'name');
        if (fields && fields.length !== uniqFields.length) {
          return message.warning(intl.get('schema.uniqProperty'));
        } else {
          this.props
            .asyncCreateTag({
              name,
              comment,
              fields,
              ttlConfig,
            })
            .then(res => {
              if (res.code === 0) {
                message.success(intl.get('schema.createSuccess'));
                this.props.history.push(`/space/${space}/tag/edit/${name}`);
              } else {
                message.warning(res.message);
              }
            });
        }
      }
    });
  };

  goBack = e => {
    e.preventDefault();
    const { match, history } = this.props;
    const {
      params: { space },
    } = match;
    confirm({
      title: intl.get('schema.leavePage'),
      content: intl.get('schema.leavePagePrompt'),
      okText: intl.get('common.confirm'),
      cancelText: intl.get('common.cancel'),
      onOk() {
        history.push(`/space/${space}/tag/list`);
        trackEvent('navigation', 'view_tag_list', 'from_tag_create');
      },
    });
  };
  render() {
    const { loading } = this.props;
    const { fieldRequired, ttlRequired } = this.state;
    const { getFieldsValue, getFieldValue } = this.props.form;
    const fieldTable = this.renderFields();
    const ttlTable = this.renderTtlConfig();
    const tagName = getFieldValue('name');
    const comment = getFieldValue('comment');
    const fields = getFieldsValue().fields
      ? getFieldsValue().fields.filter(i => i)
      : [];
    const ttlConfig = getFieldsValue().ttl ? getFieldsValue().ttl : undefined;
    const outItemLayout = {
      labelCol: {
        span: 2,
      },
      wrapperCol: {
        span: 6,
      },
    };
    const currentGQL = tagName
      ? getTagOrEdgeCreateGQL({
          type: 'TAG',
          name: tagName,
          fields,
          ttlConfig,
          comment,
        })
      : '';
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="space-config-component nebula-tag-create">
        <header>
          <Breadcrumb className="breadcrumb-bold">
            <Breadcrumb.Item>{intl.get('common.tag')}</Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="#" onClick={this.goBack}>
                {intl.get('common.list')}
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{intl.get('common.create')}</Breadcrumb.Item>
          </Breadcrumb>
          <Button onClick={this.goBack}>
            <Icon type="left" />
            {intl.get('schema.backToTagList')}
          </Button>
        </header>
        <div className="tag-form">
          <Form>
            <Form.Item label={intl.get('common.name')} {...outItemLayout}>
              {getFieldDecorator('name', {
                rules: nameRulesFn(intl),
              })(<Input />)}
            </Form.Item>
            <Form.Item label={intl.get('common.comment')} {...outItemLayout}>
              {getFieldDecorator('comment')(<Input />)}
            </Form.Item>
            <Collapse
              activeKey={fieldRequired ? ['field'] : []}
              expandIcon={() => {
                return <Checkbox checked={fieldRequired} />;
              }}
              onChange={e => {
                this.handleTogglePanels(e, 'field');
              }}
            >
              <Panel header={intl.get('schema.defineFields')} key="field">
                <Row className="form-header">
                  <Col span={4}>{intl.get('common.propertyName')}</Col>
                  <Col span={5}>{intl.get('common.dataType')}</Col>
                  <Col span={4}>{intl.get('common.allowNull')}</Col>
                  <Col span={5}>{intl.get('common.defaults')}</Col>
                  <Col span={4}>{intl.get('common.comment')}</Col>
                </Row>
                {fieldTable}
                <Row className="form-footer">
                  <Button type="primary" onClick={this.handleAddProperty}>
                    {intl.get('common.addProperty')}
                  </Button>
                </Row>
              </Panel>
            </Collapse>
            <Collapse
              activeKey={ttlRequired ? ['ttl'] : []}
              expandIcon={() => {
                return <Checkbox checked={ttlRequired} />;
              }}
              onChange={e => {
                this.handleTogglePanels(e, 'ttl');
              }}
            >
              <Panel header={intl.get('schema.setTTL')} key="ttl">
                {ttlTable}
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
  connect(mapState, mapDispatch)(Form.create<IProps>()(CreateTag)),
);
