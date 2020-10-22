import {
  Button,
  Collapse,
  Form,
  Icon,
  Input,
  message,
  Radio,
  Select,
  Table,
} from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import GQLCodeMirror from '#assets/components/GQLCodeMirror';
import { IDispatch, IRootState } from '#assets/store';
import { getExploreGQL } from '#assets/utils/gql';
import { trackEvent } from '#assets/utils/stat';

import './Expand.less';

const Option = Select.Option;
const Panel = Collapse.Panel;

const mapState = (state: IRootState) => ({
  edgeTypes: state.nebula.edgeTypes,
  edgesFields: state.nebula.edgesFields,
  selectVertexes: state.explore.selectVertexes,
  exploreStep: state.explore.step,
  exploreRules: state.explore.exploreRules,
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
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
  extends FormComponentProps,
    ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  close: () => void;
}

interface IFilter {
  field: string;
  operator: string;
  value: string;
}

interface IState {
  filters: IFilter[];
}

class Expand extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      filters: [],
    };
  }

  componentDidMount() {
    this.props.asyncGetEdgesAndFields();
  }

  handleFilterInputChange = e => {
    const { index, key } = e.target.dataset;
    const { filters } = this.state;
    filters[index][key] = e.target.value;

    this.setState({
      filters,
    });
  };

  handleFilterDelete = index => {
    const { filters } = this.state;
    this.setState({
      filters: filters.filter((_, i) => i !== index),
    });
  };

  handleFilterAdd = () => {
    const { filters } = this.state;
    this.setState({
      filters: [...filters, { field: '', operator: '', value: '' }],
    });
  };

  handleExpand = () => {
    const {
      selectVertexes,
      exploreStep,
      edgesFields,
      vertexes,
      edges,
    } = this.props;
    const { getFieldValue } = this.props.form;
    const { filters } = this.state;
    const edgeTypes = getFieldValue('edgeTypes');
    const edgeDirection = getFieldValue('edgeDirection');
    const vertexColor = getFieldValue('vertexColor');
    const quantityLimit = getFieldValue('quantityLimit') || null;
    (this.props.asyncGetExpand({
      filters,
      selectVertexes,
      edgeTypes,
      edgesFields,
      edgeDirection,
      vertexColor,
      quantityLimit,
      exploreStep: exploreStep + 1,
      originVertexes: vertexes,
      originEdges: edges,
    }) as any).then(
      () => {
        message.success(intl.get('common.success'));
        trackEvent('explore', 'expand', 'ajax success');
        this.props.updateExploreRules({
          edgeTypes,
          edgeDirection,
          vertexColor,
        });
        this.props.close();
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
  };

  render() {
    const {
      edgeTypes,
      exploreRules: rules,
      selectVertexes,
      getExpandLoading,
    } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { filters } = this.state;
    const selectEdgeTypes = getFieldValue('edgeTypes');
    const edgeDirection = getFieldValue('edgeDirection');
    const quantityLimit = getFieldValue('quantityLimit') || null;
    const currentGQL =
      selectEdgeTypes && selectEdgeTypes.length
        ? getExploreGQL({
            selectVertexes,
            edgeTypes: selectEdgeTypes,
            filters,
            edgeDirection,
            quantityLimit,
          })
        : '';
    const columns = [
      {
        title: intl.get('common.field'),
        key: 'field',
        render: (record, _, index) => (
          <Input
            onChange={this.handleFilterInputChange}
            data-index={index}
            data-key="field"
            value={record.field}
            placeholder="e.prop1"
          />
        ),
      },
      {
        title: intl.get('explore.operator'),
        key: 'operator',
        render: (record, _, index) => (
          <Input
            onChange={this.handleFilterInputChange}
            data-index={index}
            data-key="operator"
            value={record.operator}
            placeholder="=="
          />
        ),
      },
      {
        title: intl.get('explore.value'),
        key: 'value',
        render: (record, _, index) => (
          <Input
            onChange={this.handleFilterInputChange}
            id={`${index}-field`}
            data-index={index}
            data-key="value"
            value={record.value}
            placeholder="example1"
          />
        ),
      },
      {
        title: '',
        key: 'delete',
        render: (_1, _2, index) => (
          <Icon
            onClick={() => {
              this.handleFilterDelete(index);
            }}
            type="delete"
          />
        ),
      },
    ];
    return (
      <div className="graph-expand">
        <Form>
          <Form.Item label="Edge Type:">
            {getFieldDecorator('edgeTypes', {
              initialValue: rules.edgeTypes,
              rules: [
                {
                  required: true,
                  message: 'Edge Type is required',
                },
              ],
            })(
              <Select mode="multiple">
                {edgeTypes.map(e => (
                  <Option value={e} key={e}>
                    {e}
                  </Option>
                ))}
              </Select>,
            )}
          </Form.Item>
          <Form.Item label="Edge Direction:">
            {getFieldDecorator('edgeDirection', {
              initialValue: rules.edgeDirection || 'outgoing',
              rules: [
                {
                  required: true,
                },
              ],
            })(
              <Select>
                <Option value="outgoing">{intl.get('explore.outgoing')}</Option>
                <Option value="incoming">{intl.get('explore.incoming')}</Option>
              </Select>,
            )}
          </Form.Item>
          <Form.Item label={intl.get('explore.vertexColor')}>
            {getFieldDecorator('vertexColor', {
              initialValue: rules.vertexColor || 'groupByStep',
              rules: [
                {
                  required: true,
                },
              ],
            })(
              <Radio.Group className="select-color">
                <Radio.Button value="groupByStep">
                  {intl.get('explore.groupByStep')}
                </Radio.Button>
                <Radio.Button value="groupByTag">
                  {intl.get('explore.groupByTag')}
                </Radio.Button>
              </Radio.Group>,
            )}
          </Form.Item>
          <Form.Item label={intl.get('explore.quantityLimit')}>
            {getFieldDecorator('quantityLimit', {
              initialValue: rules.quantityLimit,
              rules: [
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
            })(<Input type="number" />)}
          </Form.Item>
          <Collapse className="filters">
            <Panel header={intl.get('explore.filter')} key="filter">
              <Table
                columns={columns}
                dataSource={filters}
                rowKey={(_, index) => index.toString()}
                pagination={false}
                footer={() => (
                  <Icon onClick={this.handleFilterAdd} type="plus" />
                )}
              />
            </Panel>
          </Collapse>
        </Form>
        <GQLCodeMirror currentGQL={currentGQL} />
        <Button
          onClick={this.handleExpand}
          loading={!!getExpandLoading}
          disabled={
            !selectEdgeTypes || !selectEdgeTypes.length || quantityLimit < 0
          }
        >
          {intl.get('explore.expand')}
        </Button>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Form.create()(Expand));
