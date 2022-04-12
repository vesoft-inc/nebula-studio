import { Button, Collapse } from 'antd';
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

import styles from './index.module.less';

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
      className={styles.configCollapse}
    >
      <Panel header={<>
        <span>{type} {configIndex + 1}</span>
        <CSVPreviewLink file={data.file} selected={true}>
          {data.file.name}
        </CSVPreviewLink>
      </>} key="default" extra={<CloseOutlined className={styles.btnClose} onClick={(e) => handleRemove(e, configIndex)} />}>
        <div className={styles.configItem}>
          {type === 'vertices' && <div className={styles.idRow}>
            <span className={styles.label}>vertexID</span>
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
          {type === 'vertices' && <div className={styles.btns}>
            <Button className="primaryBtn studioAddBtn" onClick={() => addTag(configIndex)}>
              <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
              {intl.get('import.addTag')}
            </Button>
          </div>}
        </div>
      </Panel>
    </Collapse>
  );
};

export default observer(SchemaConfig);
