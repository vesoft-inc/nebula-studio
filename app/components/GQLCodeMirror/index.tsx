import { Collapse, CollapseProps } from 'antd';
import { useI18n } from '@vesoft-inc/i18n';

import CodeMirror from '@app/components/CodeMirror';

import styles from './index.module.less';
interface IOptions {
  [propName: string]: any;
}
const GQLCodeMirror = (props: { currentGQL: string; option?: IOptions }) => {
  const options = {
    keyMap: 'sublime',
    fullScreen: true,
    mode: 'nebula',
    readOnly: true,
    ...props.option,
  };
  const { intl } = useI18n();
  const items: CollapseProps['items'] = [
    {
      key: 'ngql',
      label: intl.get('common.exportNGQL'),
      children: <CodeMirror value={props.currentGQL} options={options} height="80px" />,
    },
  ];
  return <Collapse className={styles.exportGql} items={items} />;
};

export default GQLCodeMirror;
