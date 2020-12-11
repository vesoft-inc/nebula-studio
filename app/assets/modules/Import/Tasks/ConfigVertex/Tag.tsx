import { Button, Form, Icon, Popconfirm, Select, Table, Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import CSVPreviewLink from '#assets/components/CSVPreviewLink';
import { IDispatch, IRootState } from '#assets/store';

import './Tag.less';

const mapState = (state: IRootState) => {
  const activeVertexIndex = state.importData.activeVertexIndex;
  const vertex = state.importData.vertexesConfig[activeVertexIndex];

  return {
    // each tag only one configed in per vertex
    // hack: this will make the component render when state is set
    tags: _.difference(
      state.nebula.tags,
      vertex.tags.map(tag => tag.name),
    ),
    currentSpace: state.nebula.currentSpace,
    vertex,
    vertexesConfig: state.importData.vertexesConfig,
    activeVertexIndex: state.importData.activeVertexIndex,
  };
};

const mapDispatch = (dispatch: IDispatch) => {
  return {
    asyncUpdateTagConfig: dispatch.importData.asyncUpdateTagConfig,
    refresh: dispatch.importData.refresh,
    deleteTag: dispatch.importData.deleteTag,
    updateVertex: dispatch.importData.updateVertexConfig,
    changeTagType: dispatch.importData.changeTagType,
  };
};

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  data: any;
  index: number;
}

const FormItem = Form.Item;
const Option = Select.Option;

class Tag extends React.Component<IProps> {
  handleTagChange = async tag => {
    const { index: tagIndex } = this.props;
    await this.props.asyncUpdateTagConfig({
      tagIndex,
      tag,
    });
  };

  handleTagDelete = () => {
    this.props.deleteTag(this.props.index);
  };

  handlePropChange = (index, field, value) => {
    const { data } = this.props;
    data.props[index][field] = value;

    this.props.refresh();
  };

  handleVertexChange = (key, value) => {
    const { vertex } = this.props;
    vertex[key] = value;

    this.props.updateVertex({
      ...vertex,
    });
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

  handleChangeTagType = async (record, tag, type) => {
    const { activeVertexIndex, vertexesConfig, changeTagType } = this.props;
    await changeTagType({
      activeVertexIndex,
      vertexesConfig,
      record,
      tagName: tag,
      type,
    });
  };

  renderPropsTable = (props, tag) => {
    const render = this.renderTableTitle;
    const { file } = this.props.vertex;
    const columns = [
      {
        title: render(
          intl.get('import.prop'),
          intl.get('import.propTip', { name: tag }),
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
            {!prop.isDefault && <span className="csv-index-mark">*</span>}
            <CSVPreviewLink
              onMapping={columnIndex =>
                this.handlePropChange(propIndex, 'mapping', columnIndex)
              }
              file={file}
              prop={prop.name}
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
            onChange={type => this.handleChangeTagType(record, tag, type)}
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
        dataSource={props}
        columns={columns}
        rowKey="name"
        pagination={false}
      />
    );
  };

  renderIdConfig = () => {
    const render = this.renderTableTitle;
    const { vertex } = this.props;
    const columns = [
      {
        title: '',
        dataIndex: 'name',
      },
      {
        title: render(
          intl.get('import.mapping'),
          intl.get('import.mappingTip'),
        ),
        dataIndex: 'idMapping',
        render: (mappingIndex, prop) => (
          <div>
            {prop && <span className="csv-index-mark">*</span>}
            <CSVPreviewLink
              onMapping={columnIndex =>
                this.handleVertexChange('idMapping', columnIndex)
              }
              file={vertex.file}
              prop={prop.name}
            >
              {mappingIndex === null ? intl.get('import.choose') : mappingIndex}
            </CSVPreviewLink>
          </div>
        ),
      },
    ];

    return (
      <>
        <h3>vertexId</h3>
        <Table
          className="id-config props-table"
          columns={columns}
          dataSource={[
            {
              name: 'vertexId',
              type: 'string',
              idMapping: vertex.idMapping,
            },
          ]}
          pagination={false}
          rowKey="name"
        />
      </>
    );
  };

  render() {
    const { index, tags, data } = this.props;
    return (
      <div className="tag-config">
        {/* vertex id config need only once for each vertex file binding, we put it ahead */}
        {index === 0 && this.renderIdConfig()}
        <h3>TAG {index + 1}</h3>
        <div className="tag-operation">
          <FormItem className="left" label="TAG">
            <Select
              className="tag-select"
              value={data.name}
              onChange={this.handleTagChange}
            >
              {tags.map(t => (
                <Option value={t} key={t}>
                  {t}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem className="right">
            <Popconfirm
              title={intl.get('common.ask')}
              onConfirm={this.handleTagDelete}
              okText={intl.get('common.ok')}
              cancelText={intl.get('common.cancel')}
            >
              <Button type="danger">{intl.get('common.delete')}</Button>
            </Popconfirm>
          </FormItem>
        </div>
        {this.renderPropsTable(data.props, data.name)}
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Tag);
