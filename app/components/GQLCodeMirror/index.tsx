import { Collapse, CollapseProps } from 'antd';
import { useI18n } from '@vesoft-inc/i18n';

import MonacoEditor from '@app/components/MonacoEditor';

import styles from './index.module.less';
interface IOptions {
  [propName: string]: any;
}
const GQLCodeMirror = (props: { currentGQL: string; option?: IOptions }) => {
  const { intl } = useI18n();
  const items: CollapseProps['items'] = [
    {
      key: 'ngql',
      label: intl.get('common.exportNGQL'),
      children: <MonacoEditor value={props.currentGQL} readOnly height="80px" />,
    },
  ];
  return <Collapse className={styles.exportGql} items={items} />;
};

export default GQLCodeMirror;
