import { useCallback, useEffect, useState } from 'react';
import { Drawer, List, Tabs, Tree } from 'antd';
import { observer } from 'mobx-react-lite';
import { useI18n } from '@vesoft-inc/i18n';
import { useStore } from '@app/stores';
import styles from './index.module.less';
import { AlertOutlined } from '@ant-design/icons';
import Icon from '@app/components/Icon';

interface DataNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  type?: string;
  parent?: string;
  space?: string;
  name?: string;
  children?: DataNode[];
}

const updateTreeData = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] =>
  list.map((node) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });

interface IProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}
const SchemaDrawer = (props: IProps) => {
  const { intl } = useI18n();
  const { setOpen, open } = props;
  const { schema } = useStore();
  const [data, setData] = useState([]);
  const getSchemaInfo = useCallback(async () => {
    const { code, data } = await schema.getSpaces();
    if (code === 0) {
      setData(formatSchemaInfo({ data, type: 'space' }));
    }
  }, []);
  const formatSchemaInfo = (payload: { data: any[]; type: string; parent?: string; space?: string }) => {
    const { data, type, parent, space } = payload;
    const typeConfig = {
      space: {
        isLeaf: false,
        getTitle: (item) => <span className={styles.treeNodeTitle}>{item}</span>,
        getKey: (item) => item,
        getName: (item) => item,
      },
      tag: {
        isLeaf: false,
        getTitle: (item) => (
          <span className={styles.treeNodeTitle}>
            ({intl.get('common.tag')}){item}
          </span>
        ),
        getKey: (item) => `${parent}.${item}`,
        getName: (item) => item,
      },
      edge: {
        isLeaf: false,
        getTitle: (item) => (
          <span className={styles.treeNodeTitle}>
            ({intl.get('common.edge')}){item}
          </span>
        ),
        getKey: (item) => `${parent}.${item}`,
        getName: (item) => item,
      },
      field: {
        isLeaf: true,
        getTitle: (item) => <span className={styles.treeNodeTitle}>{item.Field}</span>,
        getKey: (item) => `${parent}.${item.Field}`,
        getName: (item) => item.Field,
      },
    };

    const config = typeConfig[type];

    return data.map((item) => ({
      title: config.getTitle(item),
      key: config.getKey(item),
      type: type,
      isLeaf: config.isLeaf,
      parent,
      space,
      name: config.getName(item),
      children: config.isLeaf ? undefined : [],
      selectable: false,
    }));
  };
  const onLoadData = async (node) => {
    const { name, space, type, children, isLeaf } = node;
    if (children.length || isLeaf) return;
    if (type === 'space') {
      const [tags, edges] = await Promise.all([schema.getTags(name), schema.getEdges(name)]);
      setData((data) =>
        updateTreeData(data, node.key, [
          ...formatSchemaInfo({ data: tags, type: 'tag', space: name, parent: name }),
          ...formatSchemaInfo({ data: edges, type: 'edge', space: name, parent: name }),
        ]),
      );
    } else {
      const { code, data } = await schema.getTagOrEdgeInfo(node.type, name, space);
      if (code === 0) {
        setData((origin) =>
          updateTreeData(origin, node.key, formatSchemaInfo({ data: data.tables, type: 'field', space, parent: name })),
        );
      }
    }
  };

  useEffect(() => {
    getSchemaInfo();
  }, []);
  return (
    <>
      {!open && (
        <div className={styles.toggleBtn} onClick={() => setOpen(true)}>
          <AlertOutlined />
          <span className={styles.tips}>Schemas</span>
        </div>
      )}
      {open && (
        <div className={styles.schemaDrawer}>
          <Icon type="icon-studio-btn-close" className={styles.closeBtn} onClick={() => setOpen(false)} />
          <Tabs
            defaultActiveKey="schema"
            items={[
              {
                key: 'schema',
                label: 'Schema',
                children: <Tree treeData={data} loadData={onLoadData} />,
              },
              {
                key: 'ngql',
                label: 'nGQL',
                children: (
                  <>
                    <span>点语句</span>
                    <List
                      itemLayout="horizontal"
                      dataSource={[
                        {
                          title:
                            'INSERT VERTEX [IF NOT EXISTS] [tag_props, [tag_props] ...] VALUES <vid>: ([prop_value_list])',
                          description: '插入一个或多个点',
                        },
                        {
                          title: 'DELETE VERTEX <vid> [, <vid> ...]',
                          description: '删除点，以及点关联的出边和入边。',
                        },
                      ]}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            title={<span className={styles.ngqlItem}>{item.title}</span>}
                            description={item.description}
                          />
                        </List.Item>
                      )}
                    />
                  </>
                ),
              },
            ]}
          />
        </div>
      )}
    </>
  );
};

export default observer(SchemaDrawer);
