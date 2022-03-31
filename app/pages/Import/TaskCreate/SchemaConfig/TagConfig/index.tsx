import { Select, Table } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { CloseOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import CSVPreviewLink from '@app/components/CSVPreviewLink';
import classNames from 'classnames';
const Option = Select.Option;

interface IProps {
  tag: any;
  tagIndex: number;
  configIndex: number;
  file: any;
}
const VerticesConfig = (props: IProps) => {
  const { tag, tagIndex, configIndex, file } = props;
  const { dataImport, schema } = useStore();
  const { updateTagConfig, updateTagPropMapping } = dataImport;
  const { tags } = schema;

  const handleTagChange = (configIndex: number, tagIndex: number, value: string) => {
    updateTagConfig({ configIndex, tagIndex, tag: value });
  };

  const handlePropChange = (index, field, value) => {
    updateTagPropMapping({
      configIndex,
      tagIndex,
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
          {!prop.isDefault && <span className="csv-index-mark">*</span>}
          <CSVPreviewLink
            onMapping={columnIndex =>
              handlePropChange(propIndex, 'mapping', columnIndex)
            }
            file={file}
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

  const handleRemoveTag = () => {
    updateTagPropMapping({ configIndex, tagIndex });
  };
  return (
    <div className="config-container">
      <div className="tag-select-row">
        <div className="left">
          <span className="label">Tag</span>
          <Select
            bordered={false}
            className={classNames('tag-select', { 'no-value': !tag.name })}
            placeholder={intl.get('import.selectTag')}
            value={tag.name || null}
            dropdownMatchSelectWidth={false}
            onChange={value => handleTagChange(configIndex, tagIndex, value)}
          >
            {tags.map(t => (
              <Option value={t} key={t}>
                {t}
              </Option>
            ))}
          </Select>
        </div>
        <CloseOutlined className="btn-close" onClick={handleRemoveTag} />
      </div>
      {tag.name && <Table
        className="props-table"
        dataSource={tag.props}
        columns={columns}
        rowKey="name"
        pagination={false}
      />}
    </div>
  );
};

export default observer(VerticesConfig);
