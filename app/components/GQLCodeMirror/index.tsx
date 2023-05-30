import { Collapse } from 'antd';
import { useI18n } from '@vesoft-inc/i18n';

import CodeMirror from '@app/components/CodeMirror';

import styles from './index.module.less';
const Panel = Collapse.Panel;
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
  return (
    <Collapse className={styles.exportGql}>
      <Panel header={intl.get('common.exportNGQL')} key="ngql">
        <CodeMirror value={props.currentGQL} options={options} height="80px" />
      </Panel>
    </Collapse>
  );
};

export default GQLCodeMirror;
