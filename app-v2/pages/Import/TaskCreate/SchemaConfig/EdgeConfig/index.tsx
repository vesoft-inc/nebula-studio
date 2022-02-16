import { Select, Table } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { CloseOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import CSVPreviewLink from '@appv2/components/CSVPreviewLink';
import './index.less';
const Option = Select.Option;

interface IProps {
  configIndex: number;
  edge: any;
}
const EdgeConfig = (configProps: IProps) => {
  const { configIndex, edge: { type, props, file } } = configProps;
  const { dataImport, schema } = useStore();
  const { updateEdgeConfig, updateEdgePropMapping } = dataImport;
  const { edgeTypes } = schema;

  const handleEdgeChange = (index: number, value: string) => {
    updateEdgeConfig({ index, edgeType: value });
  };

  const handleRemoveEdge = () => {
    updateEdgePropMapping({ configIndex });
  };
  const handlePropChange = (index, field, value) => {
    updateEdgePropMapping({
      configIndex,
      propIndex: index,
      field,
      value
    });
  };

  const columns = [
    {
      title: intl.get('import.prop'),
      dataIndex: 'name',
    },
    {
      title: intl.get('import.mapping'),
      dataIndex: 'mapping',
      render: (mappingIndex, prop, propIndex) => (
        <div>
          {!prop.isDefault && prop.name !== 'rank' && (
            <span className="csv-index-mark">*</span>
          )}
          <CSVPreviewLink
            onMapping={columnIndex =>
              handlePropChange(propIndex, 'mapping', columnIndex)
            }
            file={file}
            prop={prop.name}
          >
            {mappingIndex === null ? intl.get('import.choose') : `Column ${mappingIndex}`}
          </CSVPreviewLink>
        </div>
      ),
    },
    {
      title: intl.get('common.type'),
      dataIndex: 'type',
    },
  ];

  return (
    <div className="tag-config-container">
      <div className="tag-select-row">
        <div className="left">
          <span className="label">Edge Type</span>
          <Select
            bordered={false}
            className="tag-select"
            value={type}
            dropdownMatchSelectWidth={false}
            onChange={value => handleEdgeChange(configIndex, value)}
          >
            {edgeTypes.map(t => (
              <Option value={t} key={t}>
                {t}
              </Option>
            ))}
          </Select>
        </div>
        <CloseOutlined className="btn-close" onClick={handleRemoveEdge} />
      </div>
      {type && <Table
        className="props-table"
        dataSource={props}
        columns={columns}
        rowKey="name"
        pagination={false}
      />}
    </div>
  );
};

export default observer(EdgeConfig);
