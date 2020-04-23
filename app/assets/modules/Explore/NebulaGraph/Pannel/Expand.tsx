import { Button, Form, Icon, Input, message, Select, Table } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';
import { trackEvent } from '#assets/utils/stat';

import './Expand.less';

const Option = Select.Option;

const mapState = (state: IRootState) => ({
  edgeTypes: state.nebula.edgeTypes,
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
  currentSpace: state.nebula.currentSpace,
  selectVertexes: state.explore.selectVertexes,
  exploreStep: state.explore.step,
  exploreRules: state.explore.exploreRules,
});
const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetEdgeTypes: dispatch.nebula.asyncGetEdgeTypes,
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
    const { host, username, password, currentSpace } = this.props;
    this.props.asyncGetEdgeTypes({
      host,
      username,
      password,
      space: currentSpace,
    });
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
      host,
      username,
      password,
      currentSpace,
      selectVertexes,
      exploreStep,
    } = this.props;
    const { getFieldValue } = this.props.form;
    const { filters } = this.state;
    const edgeTypes = getFieldValue('edgeTypes');
    const edgeDirection = getFieldValue('edgeDirection');
    const vertexColor = getFieldValue('vertexColor');
    (this.props.asyncGetExpand({
      host,
      username,
      password,
      space: currentSpace,
      filters,
      selectVertexes,
      edgeTypes,
      edgeDirection,
      vertexColor,
      exploreStep: exploreStep + 1,
    }) as any).then(
      () => {
        message.success(intl.get('common.success'));
      },
      (e: any) => {
        if (e.message) {
          message.error(e.message);
        } else {
          message.info(intl.get('common.noData'));
        }
      },
    );

    this.props.updateExploreRules({
      edgeTypes,
      edgeDirection,
      vertexColor,
    });
    this.props.close();
    trackEvent('expand', 'click');
  };

  render() {
    const { edgeTypes, exploreRules: rules } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { filters } = this.state;
    const selectEdgeTypes = getFieldValue('edgeTypes');
    const columns = [
      {
        title: intl.get('explore.field'),
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
              initialValue: rules.edgeType,
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
            })(
              <Select>
                <Option value="groupByStep">
                  {intl.get('explore.groupByStep')}
                </Option>
                <Option value="groupByTag">
                  {intl.get('explore.groupByTag')}
                </Option>
              </Select>,
            )}
          </Form.Item>
          <h3>{intl.get('explore.filter')}</h3>
          <Table
            columns={columns}
            dataSource={filters}
            rowKey={(_, index) => index.toString()}
            pagination={false}
            footer={() => <Icon onClick={this.handleFilterAdd} type="plus" />}
          />
        </Form>
        <Button
          onClick={this.handleExpand}
          disabled={!selectEdgeTypes || !selectEdgeTypes.length}
        >
          {intl.get('explore.expand')}
        </Button>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Form.create()(Expand));
