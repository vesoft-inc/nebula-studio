import { Form, Icon, Select, Table, Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import CSVPreviewLink from '#assets/components/CSVPreviewLink';
import { IDispatch, IRootState } from '#assets/store';

import './Edge.less';

const FormItem = Form.Item;
const { Option } = Select;

const mapState = (state: IRootState) => {
  const { activeEdgeIndex, edgesConfig } = state.importData;
  const edge = edgesConfig[activeEdgeIndex];

  return {
    edge,
    // hack: this will make the component render when state is set
    edgeTypes: _.difference(
      state.nebula.edgeTypes,
      edgesConfig.map(e => e.type),
    ),
    loading: state.loading.effects.importData.asyncUpdateEdgeConfig,
    space: state.nebula.currentSpace,
  };
};

const mapDispatch = (dispatch: IDispatch) => ({
  asyncUpdateEdgeConfig: dispatch.importData.asyncUpdateEdgeConfig,
  changeEdgeFieldType: dispatch.importData.changeEdgeFieldType,
  refresh: dispatch.importData.refresh,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class Edge extends React.Component<IProps> {
  handleEdgeTypeChange = async edgeType => {
    await this.props.asyncUpdateEdgeConfig({
      edgeType,
    });
  };

  handlePropChange = (index, field, value) => {
    const { edge } = this.props;
    edge.props[index][field] = value;

    this.props.refresh();
  };

  renderTableTitle = (title, desc) => {
    return (
      <p className="title-content">
        {title}
        <Tooltip title={desc}>
          <Icon type="info-circle" />
        </Tooltip>
      </p>
    );
  };

  handleChangeEdgeType = async (record, type) => {
    const { edge, changeEdgeFieldType } = this.props;
    await changeEdgeFieldType({ edge, propName: record.name, type });
  };

  renderPropsTable = () => {
    const {
      edge: { props, type, file },
      loading,
    } = this.props;
    const render = this.renderTableTitle;
    const columns = [
      {
        title: render(
          intl.get('import.prop'),
          intl.get('import.propTip', { name: `Edge ${type}` }),
        ),
        dataIndex: 'name',
      },
      {
        title: render(
          intl.get('import.mapping'),
          intl.get('import.mappingTip'),
        ),
        dataIndex: 'mapping',
        render: (mappingIndex, prop, propIndex) => (
          <div>
            {!prop.isDefault && prop.name !== 'rank' && (
              <span className="csv-index-mark">*</span>
            )}
            <CSVPreviewLink
              file={file}
              prop={prop.name}
              onMapping={columnIndex =>
                this.handlePropChange(propIndex, 'mapping', columnIndex)
              }
            >
              {mappingIndex === null ? intl.get('import.choose') : mappingIndex}
            </CSVPreviewLink>
          </div>
        ),
      },
      {
        title: render(intl.get('common.type'), intl.get('import.typeTip')),
        dataIndex: 'type',
        render: (value, record) => (
          <Select
            value={value}
            onChange={type => this.handleChangeEdgeType(record, type)}
          >
            <Option value={'int'}>{'int'}</Option>
            <Option value={'string'}>{'string'}</Option>
            <Option value={'bool'}>{'bool'}</Option>
            <Option value={'float'}>{'float'}</Option>
            <Option value={'double'}>{'double'}</Option>
            <Option value={'timestamp'}>{'timestamp'}</Option>
          </Select>
        ),
      },
    ];

    return (
      <Table
        className="props-table"
        loading={!!loading}
        dataSource={props}
        columns={columns}
        pagination={false}
        rowKey="name"
      />
    );
  };

  render() {
    const { edgeTypes, edge } = this.props;

    return (
      <div className="edge-config">
        <div className="operation">
          <FormItem label={intl.get('common.type')}>
            <Select
              className="edge-select"
              onChange={this.handleEdgeTypeChange}
              value={edge.type}
            >
              {edgeTypes.map(e => (
                <Option value={e} key={e}>
                  {e}
                </Option>
              ))}
            </Select>
          </FormItem>
          {this.renderPropsTable()}
        </div>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Edge);
