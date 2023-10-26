import { useState } from 'react';
import { List } from 'antd';
import { observer } from 'mobx-react-lite';
import styles from './index.module.less';
import Icon from '@app/components/Icon';
//TODO modify the content
const Doc = [
  {
    title:
      "CREATE TAG [IF NOT EXISTS] <tag_name> ( <prop_name> <data_type> [NULL | NOT NULL] [DEFAULT <default_value>] [COMMENT '<comment>'] [{, <prop_name> <data_type> [NULL | NOT NULL] [DEFAULT <default_value>] [COMMENT '<comment>']} ...] ) [TTL_DURATION = <ttl_duration>] [TTL_COL = <prop_name>] [COMMENT = '<comment>']",
    description: '通过指定名称创建一个 Tag。',
  },
  {
    title: 'DROP TAG [IF EXISTS] <tag_name>',
    description: '删除当前工作空间内所有点上的指定 Tag。',
  },
  {
    title:
      "ALTER TAG <tag_name> <alter_definition> [, alter_definition] ...] [ttl_definition [, ttl_definition] ... ] [COMMENT = '<comment>']",
    description: '修改 Tag 的结构。例如增删属性、修改数据类型，也可以为属性设置、修改 TTL（Time-To-Live)。',
  },
  {
    title: 'SHOW TAGS',
    description: '显示当前图空间内的所有 Tag 名称。',
  },
  {
    title: 'DESC[RIBE] TAG <tag_name>',
    description: '查看指定 Tag 的详细信息，例如字段名称、数据类型等。',
  },
  {
    title: 'DELETE TAG <tag_name_list> FROM <VID>',
    description: '删除指定点上的指定 Tag。',
  },
];
interface IProps {
  onItemClick: (title: string) => void;
}
const NgqlDrawer = (props: IProps) => {
  const [open, setOpen] = useState(false);
  const { onItemClick } = props;
  return (
    <>
      {!open && (
        <div className={styles.toggleDrawer} onClick={() => setOpen(true)}>
          <Icon type="icon-nav-taskList" className={styles.toggleBtn} />
          <Icon type="icon-Thumbnail-pack_down" className={styles.toggleBtn} />
        </div>
      )}
      {open && (
        <div className={styles.consoleDrawer}>
          <div className={styles.header}>
            <div className={styles.label}>
              <Icon type="icon-nav-taskList" className={styles.toggleBtn} />
              <span>Ngql</span>
            </div>
            <Icon type="icon-studio-btn-close" className={styles.closeBtn} onClick={() => setOpen(false)} />
          </div>
          <div className={styles.content}>
            <List
              itemLayout="horizontal"
              dataSource={Doc}
              className={styles.docList}
              renderItem={(item, index) => (
                <List.Item className={styles.ngqlItem}>
                  <span className={styles.index}>{index + 1}</span>
                  <div className={styles.itemContent}>
                    <span className={styles.title} onClick={() => onItemClick(item.title)}>
                      {item.title}
                    </span>
                    <span className={styles.description}>{item.description}</span>
                  </div>
                </List.Item>
              )}
            />
          </div>
          <div className={styles.footer}>
            <Icon type="icon-Thumbnail-pack_up" className={styles.toggleBtn} onClick={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default observer(NgqlDrawer);
