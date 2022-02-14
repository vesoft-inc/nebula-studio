import { Button, Collapse } from 'antd';
import _ from 'lodash';
import React from 'react';
import { CloseOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import CSVPreviewLink from '@appv2/components/CSVPreviewLink';
import TagConfig from './TagConfig'
import './index.less';
import EdgeConfig from './EdgeConfig';
const { Panel } = Collapse;

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
    })
  }

  const handleRemove = (event, index: number) => {
    event.stopPropagation();
    if(type === 'vertices') {
      updateVerticesConfig({ index })
    } else {
      updateEdgeConfig({ index })
    }
  }
  return (
    <Collapse
      bordered={false}
      defaultActiveKey={['default']}
      className="config-collapse"
    >
      <Panel header={<>
        <span className='config-count'>{type} {configIndex + 1}</span>
        <CSVPreviewLink file={data.file}>
          {data.file.name}
        </CSVPreviewLink>
      </>} key="default" extra={<CloseOutlined className='btn-close' onClick={(e) => handleRemove(e, configIndex)} />}>
        <div className='config-item'>
          {type === 'vertices' && <div className='id-row'>
            <span className='label'>vertexID</span>
            <CSVPreviewLink
              onMapping={columnIndex =>
                updateVerticesConfig({
                  index: configIndex,
                  key: 'idMapping',
                  value: columnIndex
                })
              }
              file={data.file}
              prop={data.name}
            >
              {data.idMapping === null ? 'Select CSV Index' : `Column ${data.idMapping}`}
            </CSVPreviewLink>
          </div>}
          {type === 'vertices' && data.tags.map((tag, tagIndex) => <TagConfig key={tagIndex} file={data.file} tag={tag} tagIndex={tagIndex} configIndex={configIndex} />)}
          {type === 'edge' && <EdgeConfig configIndex={configIndex} edge={data} />}
          {type === 'vertices' && <div className='btns'>
            <Button type="default" onClick={() => addTag(configIndex)}>
              + Add Tag
            </Button>
          </div>}
        </div>
      </Panel>
    </Collapse>
  );
};

export default observer(SchemaConfig);
