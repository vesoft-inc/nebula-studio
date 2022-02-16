import {
  Button,
  Form,
  Input,
  Popover,
  Radio,
  Select,
  Tag,
  message,
} from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { FormInstance } from 'antd/es/form';

import AddFilterForm from '../AddFilterForm';
import { Instruction } from '#app/components';
import GQLModal from '#app/components/GQLModal';
import IconFont from '#app/components/Icon';
import VertexStyleSet from '#app/components/VertexStyleSet';
import { DEFAULT_COLOR_PICKER } from '#app/config/explore';
import { IDispatch, IRootState } from '#app/store';
import { RELATION_OPERATORS } from '#app/utils/constant';
import { getExploreMatchGQL } from '#app/utils/gql';
import { trackEvent } from '#app/utils/stat';

import './index.less';

const Option = Select.Option;

const mapState = (state: IRootState) => ({
  edgeTypes: state.nebula.edgeTypes,
  edgesFields: state.nebula.edgesFields,
  spaceVidType: state.nebula.spaceVidType,
  selectVertexes: state.explore.selectVertexes,
  exploreRules: state.explore.exploreRules,
  getExpandLoading: state.loading.effects.explore.asyncGetExpand,
});
const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetEdgesAndFields: dispatch.nebula.asyncGetEdgesAndFields,
  asyncGetExpand: dispatch.explore.asyncGetExpand,
  updateExploreRules: rules =>
    dispatch.explore.update({
      exploreRules: rules,
    }),
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {
  close: () => void;
}

interface IFilter {
  expression: string;
  relation?: string;
}

interface IState {
  filters: IFilter[];
  visible: boolean;
  customColor: string;
  customIcon: string;
}

class Expand extends React.Component<IProps, IState> {
  gqlRef;
  formRef = React.createRef<FormInstance>()
  constructor(props: IProps) {
    super(props);
    this.state = {
      filters: [],
      visible: false,
      customColor: DEFAULT_COLOR_PICKER,
      customIcon: '',
    };
    this.gqlRef = React.createRef();
  }

  componentDidMount() {
    this.props.asyncGetEdgesAndFields();
    const {
      exploreRules: { filters, customIcon },
    } = this.props;
    if (filters) {
      this.setState({ filters });
    }
    if (customIcon) {
      this.setState({ customIcon });
    }
  }

  renderFilters = () => {
    const { filters } = this.state;
    const formItems = filters.map((item, index) => (
      <div key={index} className="form-item">
        {index > 0 && (
          <Form.Item>
            <Select
              value={item.relation}
              onChange={value => this.handleUpdateFilter(value, index)}
              className="select-relation"
              dropdownClassName="select-relation-dropdown"
              size="small"
            >
              {RELATION_OPERATORS.map(item => (
                <Option value={item.value} key={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
        <Form.Item>
          <Tag
            className="tag-expression"
            closable={true}
            onClose={_ => this.handleDeleteFilter(index)}
          >
            {item.expression}
          </Tag>
        </Form.Item>
      </div>
    ));
    return formItems;
  };

  handleUpdateFilter = (value, index) => {
    const { filters } = this.state;
    filters[index].relation = value;
    this.setState({
      filters,
    });
  };

  handleDeleteFilter = index => {
    const { filters } = this.state;
    this.setState({
      filters: filters.filter((_, i) => i !== index),
    });
  };

  handleExpand = () => {
    const { selectVertexes, edgesFields } = this.props;
    const { filters, customColor, customIcon } = this.state;
    this.formRef.current!.validateFields().then(async() => {
      const {
        edgeTypes,
        edgeDirection,
        stepsType,
        step,
        minStep,
        maxStep,
        vertexStyle,
        quantityLimit,
      } = this.formRef.current!.getFieldsValue();
      (this.props.asyncGetExpand({
        filters,
        selectVertexes,
        edgeTypes,
        edgesFields,
        edgeDirection,
        vertexStyle,
        quantityLimit,
        stepsType,
        step,
        minStep,
        maxStep,
        customColor,
        customIcon,
      }) as any).then(
        async() => {
          message.success(intl.get('common.success'));
          trackEvent('explore', 'expand', 'ajax success');
        },
        (e: any) => {
          trackEvent('explore', 'expand', 'ajax fail');
          if (e.message) {
            message.error(e.message);
          } else {
            message.info(intl.get('common.noData'));
          }
        },
      );
    });
  };

  handleAddFilter = data => {
    const { field, operator, value } = data;
    const { filters } = this.state;
    const expression = `${field} ${operator} ${value}`;
    const newFilter =
      filters.length === 0
        ? { expression }
        : {
          relation: 'AND',
          expression,
        };
    this.setState(
      {
        filters: [...filters, newFilter],
        visible: false,
      },
      this.handleUpdateRules,
    );
  };

  handleResetFilters = () => {
    this.setState({ filters: [] }, this.handleUpdateRules);
  };
  handleVisibleChange = visible => {
    this.setState({ visible });
  };

  hide = () => {
    this.setState({
      visible: false,
    });
  };

  handleViewGQL = () => {
    if (this.gqlRef) {
      this.gqlRef.show();
    }
  };

  handleCustomColor = color => {
    this.setState(
      {
        customColor: color,
      },
      this.handleUpdateRules,
    );
  };

  handleCustomIcon = icon => {
    this.setState(
      {
        customIcon: icon.content ? icon.type : '',
      },
      this.handleUpdateRules,
    );
  };

  handleUpdateRules = () => {
    const { filters, customColor, customIcon } = this.state;
    setTimeout(() => {
      const {
        edgeTypes,
        edgeDirection,
        stepsType,
        step,
        minStep,
        maxStep,
        vertexStyle,
        quantityLimit,
      } = this.formRef.current!.getFieldsValue();
      this.props.updateExploreRules({
        edgeTypes,
        edgeDirection,
        vertexStyle,
        quantityLimit,
        stepsType,
        step,
        minStep,
        maxStep,
        customColor,
        customIcon,
        filters,
      });
    }, 100);
  };
  render() {
    const {
      edgeTypes,
      exploreRules: rules,
      selectVertexes,
      getExpandLoading,
      spaceVidType,
      close,
    } = this.props;
    const { filters, customColor, customIcon } = this.state;
    const {
      edgeTypes: selectEdgeTypes,
      edgeDirection,
      stepsType,
      step,
      minStep,
      maxStep,
      quantityLimit,
    } = this.formRef.current!.getFieldsValue();
    const currentGQL =
      selectEdgeTypes && selectEdgeTypes.length
        ? getExploreMatchGQL({
          selectVertexes,
          edgeTypes: selectEdgeTypes,
          filters,
          edgeDirection,
          quantityLimit,
          spaceVidType,
          stepsType,
          step,
          minStep,
          maxStep,
        })
        : '';
    const fieldTable = this.renderFilters();
    return (
      <div className="graph-expand">
        <div className="expand-config">
          <Form colon={false} ref={this.formRef} initialValues={{
            edgeTypes: rules.edgeTypes && rules.edgeTypes.length > 0
              ? rules.edgeTypes
              : edgeTypes,
            edgeDirection: rules.edgeDirection || 'outgoing',
            stepsType: rules.stepsType || 'single',
            step: rules.step || '1',
            minStep: rules.minStep || '',
            maxStep: rules.maxStep || '',
            vertexStyle: rules.vertexStyle || 'colorGroupByTag',
            quantityLimit: rules.quantityLimit || 100,

          }}>
            <Form.Item label={intl.get('common.edge')} name="edgeTypes" rules={[
              {
                required: true,
                message: 'Edge Type is required',
              },
            ]}>
              <Select mode="multiple" onChange={this.handleUpdateRules}>
                {edgeTypes.map(e => (
                  <Option value={e} key={e}>
                    {e}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={intl.get('explore.direction')} name="edgeDirection" rules={[
              {
                required: true,
              },
            ]}>
              <Select onChange={this.handleUpdateRules}>
                <Option value="outgoing">
                  {intl.get('explore.outgoing')}
                </Option>
                <Option value="incoming">
                  {intl.get('explore.incoming')}
                </Option>
                <Option value="bidirect">
                  {intl.get('explore.bidirect')}
                </Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={intl.get('explore.steps')}
              className="select-step-type"
              name="stepsType"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Radio.Group onChange={this.handleUpdateRules}>
                <Radio value="single">{intl.get('explore.singleStep')}</Radio>
                <Radio value="range">{intl.get('explore.rangeStep')}</Radio>
              </Radio.Group>
            </Form.Item>
            {stepsType === 'single' && (
              <Form.Item className="input-step" name="step" rules={[
                {
                  message: intl.get('formRules.positiveIntegerRequired'),
                  pattern: /^\d+$/,
                  transform(value) {
                    if (value) {
                      return Number(value);
                    }
                  },
                },
                {
                  required: true,
                },
              ]}>
                <Input type="number" onChange={this.handleUpdateRules} />)
              </Form.Item>
            )}
            {stepsType === 'range' && (
              <div className="input-step">
                <Form.Item name="minStep" rules={[
                  {
                    message: intl.get('formRules.positiveIntegerRequired'),
                    pattern: /^\d+$/,
                    transform(value) {
                      if (value) {
                        return Number(value);
                      }
                    },
                  },
                  {
                    required: true,
                  },
                ]}>
                  <Input type="number" onChange={this.handleUpdateRules} />
                </Form.Item>
                -
                <Form.Item name="maxStep" rules={[
                  {
                    message: intl.get('formRules.positiveIntegerRequired'),
                    pattern: /^\d+$/,
                    transform(value) {
                      if (value) {
                        return Number(value);
                      }
                    },
                  },
                  {
                    required: true,
                  },
                ]}>
                  <Input type="number" onChange={this.handleUpdateRules} />
                </Form.Item>
              </div>
            )}
            <Form.Item label={intl.get('explore.vertexStyle')} name="vertexStyle" rules={[{ required: true }]}>
              <Radio.Group onChange={this.handleUpdateRules}>
                <Radio value="colorGroupByTag">
                  {intl.get('explore.colorGroupByTag')}
                </Radio>
                <Radio value="custom">
                  {intl.get('explore.customStyle')}
                </Radio>
                <VertexStyleSet
                  handleChangeColorComplete={this.handleCustomColor}
                  handleChangeIconComplete={this.handleCustomIcon}
                  icon={customIcon}
                  color={customColor}
                />
              </Radio.Group>
            </Form.Item>
            <Form.Item label={intl.get('explore.quantityLimit')} name="quantityLimit" rules={[
              {
                message: intl.get('formRules.positiveIntegerRequired'),
                pattern: /^\d+$/,
                transform(value) {
                  if (value) {
                    return Number(value);
                  }
                },
              },
            ]}>
              <Input type="number" onChange={this.handleUpdateRules} />
            </Form.Item>
            <div className="filter-component">
              <div className="filter-header">
                <span>{intl.get('explore.filter')}</span>
                <div
                  className="btn-reset"
                  data-track-category="explore"
                  data-track-action="expand_filter_reset"
                  onClick={this.handleResetFilters}
                >
                  <IconFont type="iconstudio-remake" />
                  <span>{intl.get('import.reset')}</span>
                </div>
              </div>
              {fieldTable}
              <Popover
                content={
                  <AddFilterForm
                    onConfirm={this.handleAddFilter}
                    onCancel={this.hide}
                  />
                }
                visible={this.state.visible}
                onVisibleChange={this.handleVisibleChange}
                trigger="click"
              >
                <Button
                  className="btn-add-filter"
                  data-track-category="explore"
                  data-track-action="expand_filter_add"
                  icon="plus"
                  type="link"
                >
                  {intl.get('explore.addCondition')}
                </Button>
              </Popover>
            </div>
          </Form>
          <GQLModal
            gql={currentGQL}
            handlerRef={handler => {
              this.gqlRef = handler;
            }}
          />
          <Button
            className="btn-gql"
            data-track-category="explore"
            data-track-action="expand_gql_view"
            onClick={this.handleViewGQL}
          >
            {intl.get('common.exportNGQL')}
          </Button>
        </div>
        <div className="expand-footer">
          <IconFont
            type="iconstudio-indentleft"
            className="btn-collapse"
            onClick={close}
            data-track-category="explore"
            data-track-action="expand_sider_close"
          />
          <Button
            type="primary"
            onClick={this.handleExpand}
            loading={!!getExpandLoading}
            data-track-category="explore"
            data-track-action="graph_expand"
            data-track-label="from_sider"
            disabled={
              !selectVertexes.length ||
              !selectEdgeTypes ||
              !selectEdgeTypes.length ||
              quantityLimit < 0
            }
          >
            {intl.get('explore.expand')}
          </Button>
          <Instruction description={intl.get('explore.expandTips')} />
        </div>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Expand);
