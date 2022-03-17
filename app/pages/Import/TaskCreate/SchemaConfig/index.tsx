import { Button, Collapse } from 'antd';
import _ from 'lodash';
import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import CSVPreviewLink from '@app/components/CSVPreviewLink';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import TagConfig from './TagConfig';
import EdgeConfig from './EdgeConfig';
const { Panel } = Collapse;

import './index.less';

interface IProps {
  type: 'vertices' | 'edge'
  data: any;
  configIndex: number;
}
const SchemaConfig = (props: IProps) => {
  const { type, data, configIndex } = props;
  const { dataImport } = useStore();
  const { verticesConfig, updateVerticesConfig, updateEdgeConfig } = dataImport;

  const addTag = index => {
    updateVerticesConfig({
      index,
      key: 'tags',
      value: [...verticesConfig[index].tags, {
        name: '',
        props: []
      }]
    });
  };

  const handleRemove = (event, index: number) => {
    event.stopPropagation();
    if(type === 'vertices') {
      updateVerticesConfig({ index });
    } else {
      updateEdgeConfig({ index });
    }
  };
  return (
    <Collapse
      bordered={false}
      defaultActiveKey={['default']}
      className="config-collapse"
    >
      <Panel header={<>
        <span className="config-count">{type} {configIndex + 1}</span>
        <CSVPreviewLink file={data.file} selected={true}>
          {data.file.name}
        </CSVPreviewLink>
      </>} key="default" extra={<CloseOutlined className="btn-close" onClick={(e) => handleRemove(e, configIndex)} />}>
        <div className="config-item">
          {type === 'vertices' && <div className="id-row">
            <span className="label">vertexID</span>
            <CSVPreviewLink
              onMapping={columnIndex =>
                updateVerticesConfig({
                  index: configIndex,
                  key: 'idMapping',
                  value: columnIndex
                })
              }
              file={data.file}
            >
              {data.idMapping === null ? 'Select CSV Index' : `Column ${data.idMapping}`}
            </CSVPreviewLink>
          </div>}
          {type === 'vertices' && data.tags.map((tag, tagIndex) => <TagConfig key={tagIndex} file={data.file} tag={tag} tagIndex={tagIndex} configIndex={configIndex} />)}
          {type === 'edge' && <EdgeConfig configIndex={configIndex} edge={data} />}
          {type === 'vertices' && <div className="btns">
            <Button className="primary-btn studio-add-btn" onClick={() => addTag(configIndex)}>
              <Icon className="studio-add-btn-icon" type="icon-studio-btn-add" />
              {intl.get('import.addTag')}
            </Button>
          </div>}
        </div>
      </Panel>
    </Collapse>
  );
};

export default observer(SchemaConfig);
