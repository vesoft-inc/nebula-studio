import { Tabs } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';
import { LinkObject, NodeObject } from '@vesoft-inc/force-graph';
import { useI18n } from '@vesoft-inc/i18n';
import ExpandItem from '../ExpandItem';
import styles from './index.module.less';

interface IProps {
  data: {
    nodes: NodeObject[];
    links: LinkObject[];
  };
  spaceVidType: string;
}

const DisplayComponent = (props: IProps) => {
  const [tab, setTab] = useState<any>('nodes');
  const { data, spaceVidType } = props;
  const { intl } = useI18n();
  const { nodes, links } = data;
  const [list, setList] = useState<{
    nodes: NodeObject[];
    links: LinkObject[];
  }>({
    nodes: [],
    links: [],
  });
  useEffect(() => {
    setList({
      nodes: flattenVertex(nodes),
      links: flattenEdge(links),
    });
  }, [data]);

  const flattenVertex = (data) => {
    return data.map((item) => {
      const _data = [
        {
          key: 'Tag',
          value: item.tags,
        },
        {
          key: 'VID',
          value: item.id,
          vidType: spaceVidType,
        },
      ] as any;
      const properties = item.properties;
      Object.keys(properties).forEach((property) => {
        const valueObj = properties[property];
        Object.keys(valueObj).forEach((field) => {
          _data.push({
            key: `${property}.${field}`,
            value: valueObj[field],
          });
        });
      });
      return _data;
    });
  };

  const flattenEdge = (data) => {
    return data.map((item) => {
      const _data = [
        {
          key: 'id',
          value: item.id,
        },
      ];
      const name = item.edgeType;
      const properties = item.properties;
      Object.keys(properties).forEach((property) => {
        const value = properties[property];
        _data.push({
          key: `${name}.${property}`,
          value,
        });
      });
      return _data;
    });
  };
  const items = [
    {
      label: intl.get('import.vertexText') + `(${nodes.length})`,
      key: 'nodes',
    },
    {
      label: intl.get('import.edgeText') + `(${links.length})`,
      key: 'links',
    },
  ];
  return (
    <div className={styles.displayExpand}>
      <Tabs className={styles.headerTab} onChange={setTab} defaultActiveKey={tab} items={items} />
      <div className={styles.content}>
        {list[tab].length > 0 &&
          list[tab].map((item: NodeObject | LinkObject, index) => (
            <ExpandItem key={uuidv4()} data={item} title={`${tab} ${index + 1}`} index={index} />
          ))}
      </div>
    </div>
  );
};

export default DisplayComponent;
