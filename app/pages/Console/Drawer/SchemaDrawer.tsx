import { useCallback, useEffect, useMemo, useState } from 'react';
import { Input, Tree } from 'antd';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import styles from './index.module.less';
import Icon from '@app/components/Icon';
import { DownOutlined, SearchOutlined } from '@ant-design/icons';
import { useI18n } from '@vesoft-inc/i18n';

const isIncluded = (a: string, b: string) => {
  return a.toLowerCase().includes(b.toLowerCase());
};

const SchemaDrawer = () => {
  const { intl } = useI18n();
  const [open, setOpen] = useState(false);
  const { schema, console } = useStore();
  const { schemaOverview, update, currentSpace } = console;
  const [searchVal, setSearchVal] = useState('');
  const [expandedKeys, setExpandedKeys] = useState([]);
  const getSchemaInfo = useCallback(async () => {
    if (schemaOverview.length) return;
    const { code, data } = await schema.getSpaces();
    if (code === 0) {
      update({
        schemaOverview: data.map((item) => ({
          name: item,
          type: 'space',
          children: [],
        })),
      });
    }
  }, []);
  useEffect(() => {
    if (currentSpace) {
      setExpandedKeys(Array.from(new Set([...expandedKeys, currentSpace])));
    }
  }, [currentSpace]);
  const formatSchemaInfo = (payload: { data: any[]; parent?: string; space?: string }) => {
    const { data, parent, space } = payload;
    const typeConfig = {
      space: {
        isLeaf: false,
        getTitle: (item) => item.name,
        getKey: (item) => item.name,
        getName: (item) => item.name,
        icon: <Icon type="icon-workflow-autoLayout" className={styles.treeNodeIcon} />,
      },
      tag: {
        isLeaf: false,
        getTitle: (item) => item.name,
        getKey: (item) => `${space}.${item.name}`,
        getName: (item) => item.name,
        icon: <Icon type="icon-Thumbnail-graphView" className={styles.treeNodeIcon} />,
      },
      edge: {
        isLeaf: false,
        getTitle: (item) => item.name,
        getKey: (item) => `${space}.${item.name}`,
        getName: (item) => item.name,
        icon: <Icon type="icon-nav-findPath" className={styles.treeNodeIcon} />,
      },
      field: {
        isLeaf: true,
        getTitle: (item) => (
          <>
            <span className={styles.fieldTypeName}>{item.Field}</span>
            <span className={styles.fieldTypeTag}>{item.Type}</span>
          </>
        ),
        getKey: (item) => `${space}.${parent}.${item.Field}`,
        getName: (item) => item.Field,
      },
    };
    return data.map((item) => {
      const config = typeConfig[item.type];
      const space = item.type === 'space' ? item.name : parent;
      const name = config.getName(item);
      return {
        title: config.getTitle(item),
        key: config.getKey(item),
        type: item.type,
        isLeaf: config.isLeaf,
        parent,
        space,
        name,
        children: item.children?.length ? formatSchemaInfo({ data: item.children, parent: name, space }) : [],
        icon: config.icon,
      };
    });
  };
  const onLoadData = async (node) => {
    const { name, space, type, children, isLeaf } = node;
    if (children.length || isLeaf) return;
    if (type === 'space') {
      const [tags, edges] = await Promise.all([schema.getTags(name), schema.getEdges(name)]);
      update({
        schemaOverview: schemaOverview.map((i) => {
          if (i.name !== name) return i;
          return {
            ...i,
            children: [
              ...tags.map((tag) => ({
                name: tag,
                type: 'tag',
                children: [],
              })),
              ...edges.map((edge) => ({
                name: edge,
                type: 'edge',
                children: [],
              })),
            ],
          };
        }),
      });
    } else {
      const { code, data } = await schema.getTagOrEdgeInfo(node.type, name, space);
      if (code === 0) {
        const newData = schemaOverview.map((i) => {
          if (i.name !== space) return i;
          return {
            ...i,
            children: i.children.map((j) => {
              if (j.name === name) {
                return {
                  ...j,
                  children: data.tables.map((i) => ({ ...i, type: 'field' })),
                };
              }
              return j;
            }),
          };
        });
        update({ schemaOverview: newData });
      }
    }
  };

  const onSearch = (e) => {
    const { value } = e.target;
    setSearchVal(value);
  };
  const data = useMemo(() => {
    let _data = schemaOverview || [];
    if (searchVal !== '') {
      _data = _data.filter((i) => isIncluded(i.name, searchVal));
    }
    return formatSchemaInfo({ data: _data });
  }, [schemaOverview, searchVal]);
  useEffect(() => {
    getSchemaInfo();
  }, []);
  return (
    <>
      {!open && (
        <div className={styles.toggleDrawer} onClick={() => setOpen(true)}>
          <Icon type="icon-Thumbnail-treeView" className={styles.toggleBtn} />
          <Icon type="icon-Thumbnail-pack_up" className={styles.toggleBtn} />
        </div>
      )}
      {open && (
        <div className={styles.consoleDrawer}>
          <div className={styles.header}>
            <div className={styles.label}>
              <Icon type="icon-Thumbnail-treeView" className={styles.toggleBtn} />
              <span>{intl.get('common.schema')}</span>
            </div>
            <Icon type="icon-studio-btn-close" className={styles.closeBtn} onClick={() => setOpen(false)} />
          </div>
          <div className={styles.content}>
            <Input
              placeholder="Search space name..."
              prefix={<SearchOutlined />}
              className={styles.inputSearch}
              onChange={onSearch}
            />
            <Tree
              onExpand={setExpandedKeys}
              expandedKeys={expandedKeys}
              switcherIcon={<DownOutlined />}
              blockNode
              showIcon
              selectable={false}
              treeData={data}
              loadData={onLoadData}
            />
          </div>
          <div className={styles.footer}>
            <Icon type="icon-Thumbnail-pack_down" className={styles.toggleBtn} onClick={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default observer(SchemaDrawer);
