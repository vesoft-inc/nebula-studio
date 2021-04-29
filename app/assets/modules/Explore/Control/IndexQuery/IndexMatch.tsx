import {
  Button,
  Divider,
  Form,
  Icon,
  Input,
  List,
  message,
  Modal,
  Radio,
  Select,
  Table,
} from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Instruction } from '#assets/components';
import GQLCodeMirror from '#assets/components/GQLCodeMirror';
import { IDispatch, IRootState } from '#assets/store';
import { enumOfCompare } from '#assets/utils/constant';
import { getExploreGQLWithIndex } from '#assets/utils/gql';

import './IndexMatch.less';
const Option = Select.Option;
const { confirm } = Modal;

const mapState = (state: IRootState) => ({
  indexes: state.nebula.indexes,
  getQueryLoading: state.loading.effects.explore.asyncImportNodesWithIndex,
  tags: state.nebula.tagIndexTree,
});
const mapDispatch = (dispatch: IDispatch) => ({
  asyncImportNodesWithIndex: dispatch.explore.asyncImportNodesWithIndex,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {
  closeHandler: any;
}

interface IField {
  Field: string;
  Type: string;
}
interface IIndex {
  indexName: string;
  props: IField[];
}
interface ITag {
  name: string;
  indexes: IIndex[];
}

interface IFilterProps {
  Field: string;
  Type: string;
}
interface IFilters {
  relation?: string;
  field: string;
  operator: string;
  value: string | boolean;
  type: string | undefined;
}
interface IState {
  selectedTag: ITag | null;
  selectedIndex: IIndex | null;
  filterProps: IFilterProps[];
  filters: IFilters[];
}

class IndexMatch extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      selectedTag: null,
      selectedIndex: null,
      filterProps: [],
      filters: [],
    };
  }

  handleSelectTag = value => {
    const { tags } = this.props;
    const { setFieldsValue } = this.props.form;
    const selectedTag = tags.filter(item => item.name === value)[0] || {};
    this.setState({
      selectedTag,
      filterProps: [],
      filters: [],
    });
    setFieldsValue({ index: null });
  };

  handleSelectIndex = value => {
    const { selectedTag } = this.state;
    const indexes = selectedTag?.indexes || [];
    const selectedIndex = indexes.filter(item => item.indexName === value)[0];
    const defaultData = [
      {
        field: selectedIndex.props[0].Field,
        operator: '==',
        value: '',
        type: selectedIndex.props[0].Type,
      },
    ];
    this.setState({
      filterProps: selectedIndex.props,
      filters: defaultData,
    });
  };

  handleFilterInputChange = (e, type?: string) => {
    const { index, key } = e.target.dataset;
    const { filters } = this.state;
    const reg = /^[0-9]*$/;
    let value = e.target.value;
    if (type === 'timestamp' && !reg.test(value)) {
      message.warning(intl.get('explore.timestampInput'));
      value = value.slice(0, value.length - 1);
    }
    filters[index][key] = value;
    this.setState({
      filters,
    });
  };

  handleFilterBoolChange = (e, index, key) => {
    const { filters } = this.state;
    filters[index][key] = e.target.value;

    this.setState({
      filters,
    });
  };

  handleSelect = (value, key, index) => {
    const { filters } = this.state;
    filters[index][key] = value;
    this.setState({ filters });
  };

  handleFieldSelect = (value, index) => {
    const self = this;
    const { filters, filterProps } = this.state;
    const _value = {
      relation: 'AND',
      field: value,
      operator: '==',
      value: '',
      type: filterProps.find(i => i.Field === value)?.Type,
    };
    const nextField = index === filters.length - 1 ? null : filters[index + 1];
    if (nextField) {
      const selectedIndex = filterProps.findIndex(i => i.Field === value);
      const nextIndex = filterProps.findIndex(i => i.Field === nextField.field);
      if (nextIndex - selectedIndex > 1) {
        confirm({
          title: intl.get('explore.operationConfirm'),
          onOk() {
            filters.splice(index, filters.length - index, _value);
            self.setState({ filters });
          },
        });
        return;
      } else {
        filters.splice(index, 1, _value);
      }
    } else {
      filters.splice(index, 1, _value);
    }
    this.setState({ filters });
  };

  handleFilterDelete = index => {
    const self = this;
    const { filters, filterProps } = this.state;
    const nextField = index === filters.length - 1 ? null : filters[index + 1];
    const preField = filters[index - 1];
    if (nextField) {
      const preIndex = filterProps.findIndex(i => i.Field === preField.field);
      const nextIndex = filterProps.findIndex(i => i.Field === nextField.field);
      if (nextIndex - preIndex > 1) {
        confirm({
          title: intl.get('explore.operationConfirm'),
          onOk() {
            filters.splice(index, filters.length - index);
            self.setState({ filters });
          },
        });
        return;
      } else {
        filters.splice(index, 1);
      }
    } else {
      filters.splice(index, 1);
    }
    this.setState({ filters });
  };

  handleFilterAdd = () => {
    const { filters, filterProps } = this.state;
    if (filters && filters.length > 0) {
      const lastField = filters[filters.length - 1].field;
      const index = filterProps.findIndex(i => i.Field === lastField);
      const newField =
        index === filterProps.length - 1
          ? filterProps[index]
          : filterProps[index + 1];
      this.setState({
        filters: [
          ...filters,
          {
            relation: 'AND',
            field: newField.Field,
            operator: '==',
            value: '',
            type: newField.Type,
          },
        ],
      });
    }
  };

  handleInquiry = () => {
    const { getFieldValue } = this.props.form;
    const { filters } = this.state;
    const tag = getFieldValue('tag');
    const quantityLimit = getFieldValue('quantityLimit') || null;
    (this.props.asyncImportNodesWithIndex({
      filters,
      tag,
      quantityLimit,
    }) as any).then(
      () => {
        this.props.closeHandler();
      },
      (e: any) => {
        if (e.message) {
          message.error(e.message);
        } else {
          message.info(intl.get('common.noData'));
        }
      },
    );
  };

  render() {
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const { selectedTag, filters, filterProps } = this.state;
    const { tags } = this.props;
    const { getQueryLoading } = this.props;
    const tag = getFieldValue('tag');
    const index = getFieldValue('index');
    const quantityLimit = getFieldValue('quantityLimit') || null;
    const missingField = filters.some(item => {
      return Object.values(item).some(value => value === '');
    });
    const currentGQL =
      tag && index
        ? getExploreGQLWithIndex({
            tag,
            quantityLimit,
            filters,
          })
        : '';
    const columns = [
      {
        title: intl.get('explore.relationship'),
        key: 'relation',
        width: 120,
        render: (record, _, index) =>
          index > 0 && (
            <Select
              value={record.relation}
              onChange={value => this.handleSelect(value, 'relation', index)}
            >
              <Option value="AND" key="AND">
                AND
              </Option>
              <Option value="OR" key="OR">
                OR
              </Option>
            </Select>
          ),
      },
      {
        title: intl.get('common.field'),
        key: 'field',
        render: (record, _, index) => {
          let pre;
          let _list;
          if (index > 0) {
            pre = filterProps.findIndex(
              i => i.Field === filters[index - 1].field,
            );
            _list = filterProps.slice(pre, pre + 2);
          }
          return (
            <>
              {index === 0 && (
                <Input
                  disabled={true}
                  data-index={index}
                  data-key="field"
                  value={record.field}
                  placeholder="e.prop1"
                />
              )}
              {index > 0 && (
                <Select
                  value={record.field}
                  onChange={value => this.handleFieldSelect(value, index)}
                >
                  {_list.map(i => (
                    <Option value={i.Field} key={i.Field}>
                      {i.Field}
                    </Option>
                  ))}
                </Select>
              )}
            </>
          );
        },
      },
      {
        title: intl.get('explore.operator'),
        key: 'operator',
        width: 120,
        render: (record, _, index) => {
          const type = record.type.startsWith('fixed_string')
            ? 'string'
            : record.type;
          return (
            <Select
              value={record.operator}
              onChange={value => this.handleSelect(value, 'operator', index)}
            >
              {enumOfCompare[type].map(i => (
                <Option value={i.value} key={i.value}>
                  {i.label}
                </Option>
              ))}
            </Select>
          );
        },
      },
      {
        title: intl.get('explore.value'),
        key: 'value',
        render: (record, _, index) => (
          <>
            {record.type !== 'bool' && record.type !== 'timestamp' && (
              <Input
                onChange={this.handleFilterInputChange}
                id={`${index}-field`}
                data-index={index}
                data-key="value"
                value={record.value}
                placeholder="example1"
              />
            )}
            {record.type === 'bool' && (
              <Radio.Group
                value={record.value}
                onChange={e => this.handleFilterBoolChange(e, index, 'value')}
                id={`${index}-field`}
                data-index={index}
                data-key="value"
              >
                <Radio value={true}>true</Radio>
                <Radio value={false}>false</Radio>
              </Radio.Group>
            )}
            {record.type === 'timestamp' && (
              <Input
                onChange={e => this.handleFilterInputChange(e, 'timestamp')}
                id={`${index}-field`}
                data-index={index}
                data-key="value"
                value={record.value}
                placeholder="example1"
              />
            )}
          </>
        ),
      },
      {
        title: '',
        key: 'delete',
        render: (_1, _2, index) =>
          index > 0 && (
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
      <div className="query-index">
        <Form>
          <Form.Item label="TAG">
            {getFieldDecorator('tag', {
              rules: [
                {
                  required: true,
                  message: 'Tag is required',
                },
              ],
            })(
              <Select onChange={this.handleSelectTag}>
                {tags.map(e => (
                  <Option value={e.name} key={e.name}>
                    {e.name}
                  </Option>
                ))}
              </Select>,
            )}
          </Form.Item>
          <Form.Item label={intl.get('explore.selectIndex')}>
            {getFieldDecorator('index', {
              rules: [
                {
                  required: true,
                  message: 'Index is required',
                },
              ],
            })(
              <Select onChange={this.handleSelectIndex}>
                {selectedTag &&
                  selectedTag.indexes.map(e => (
                    <Option
                      value={e.indexName}
                      key={e.indexName}
                      disabled={e.props.length === 0}
                    >
                      {e.indexName} ({e.props.map(i => i.Field).join(', ')})
                    </Option>
                  ))}
              </Select>,
            )}
            {selectedTag &&
              selectedTag.indexes.filter(index => index.props.length === 0)
                .length > 0 && (
                <Instruction description={intl.get('explore.emptyIndexTips')} />
              )}
          </Form.Item>
          <Form.Item label={intl.get('explore.quantityLimit')}>
            {getFieldDecorator('quantityLimit', {
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
          <List
            className="comment-list"
            header={
              <Divider orientation="center">
                {intl.get('explore.paramFilter')}
                <Instruction
                  description={intl.get('explore.indexConditionDescription')}
                />
              </Divider>
            }
            itemLayout="horizontal"
          >
            <li>
              <Table
                columns={columns}
                dataSource={filters}
                rowKey={(_, index) => index.toString()}
                pagination={false}
                footer={() => (
                  <Icon type="plus" onClick={this.handleFilterAdd} />
                )}
              />
            </li>
          </List>
        </Form>
        <GQLCodeMirror currentGQL={currentGQL} />
        <Button
          type="primary"
          data-track-category="explore"
          data-track-action="query_by_index"
          onClick={this.handleInquiry}
          disabled={
            !tag ||
            !index ||
            !!getQueryLoading ||
            missingField ||
            quantityLimit < 0
          }
        >
          {intl.get('explore.quiry')}
        </Button>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Form.create()(IndexMatch));
