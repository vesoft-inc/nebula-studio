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
    host: state.nebula.host,
    username: state.nebula.username,
    password: state.nebula.password,
    loading: state.loading.effects.importData.asyncUpdateEdgeConfig,
    space: state.nebula.currentSpace,
  };
};

const mapDispatch = (dispatch: IDispatch) => ({
  asyncUpdateEdgeConfig: dispatch.importData.asyncUpdateEdgeConfig,
  refresh: dispatch.importData.refresh,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class Edge extends React.Component<IProps> {
  handleEdgeTypeChange = async edgeType => {
    const { host, username, password, space } = this.props;
    await this.props.asyncUpdateEdgeConfig({
      host,
      username,
      password,
      space,
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
          <CSVPreviewLink
            file={file}
            prop={prop.field}
            onMapping={columnIndex =>
              this.handlePropChange(propIndex, 'mapping', columnIndex)
            }
          >
            {mappingIndex || intl.get('import.ignore')}
          </CSVPreviewLink>
        ),
      },
      {
        title: render(intl.get('import.type'), intl.get('import.typeTip')),
        dataIndex: 'type',
        render: value => (
          <Select value={value} disabled={true}>
            <Option value={value}>{value}</Option>
          </Select>
        ),
      },
      {
        title: render(
          intl.get('import.useHash'),
          intl.get('import.useHashTip'),
        ),
        dataIndex: 'useHash',
        render: (value, record, index) => {
          const { name } = record;
          if (name === 'srcId' || name === 'dstId') {
            return (
              <Select
                value={value}
                onChange={v => this.handlePropChange(index, 'useHash', v)}
              >
                <Option value="unset">{intl.get('import.unset')}</Option>
                <Option value="hash">{intl.get('import.hash')}</Option>
                <Option value="uuid">{intl.get('import.uuid')}</Option>
              </Select>
            );
          } else {
            return '-';
          }
        },
      },
    ];

    return (
      <Table
        className="props-table"
        loading={!!loading}
        dataSource={props}
        columns={columns}
        rowKey="prop"
      />
    );
  };

  render() {
    const { edgeTypes, edge } = this.props;

    return (
      <div className="edge-config">
        <div className="operation">
          <FormItem label={intl.get('import.type')}>
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

export default connect(
  mapState,
  mapDispatch,
)(Edge);
