import { Button, message, Modal, Spin } from 'antd';
import Icon from '@app/components/Icon';
import React, { useCallback, useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import CodeMirror from '@app/components/CodeMirror';


import { useStore } from '@app/stores';
import { handleKeyword } from '@app/utils/function';
import styles from './index.module.less';

interface IProps {
  space: string;
}

const sleepGql = `:sleep 20;`;
const DDLButton = (props: IProps) => {
  const { space } = props;
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { schema: { getSchemaDDL } } = useStore();
  const [ddl, setDDL] = useState('');
  const options = {
    keyMap: 'sublime',
    fullScreen: true,
    mode: 'nebula',
    readOnly: true,
  };
  const handleOpen = useCallback(async () => {
    setVisible(true);
    setLoading(true);
    const ddlMap = await getSchemaDDL(space);
    if(ddlMap) {
      const { tags, edges, indexes } = ddlMap;
      let content = `# Create Space \n${ddlMap.space.replace(/ON default_zone_(.*)+/gm, '')};\n${sleepGql}\nUSE ${handleKeyword(space)};`;
      if(tags.length) {
        content += `\n\n# Create Tag: \n${tags.map(i => i.replaceAll('\n', '')).join(';\n')};`;
      }
      if(edges.length) {  
        content += `\n\n# Create Edge: \n${edges.map(i => i.replaceAll('\n', '')).join(';\n')};`;
      }

      if(indexes.length) {
        if((tags.length || edges.length)) {
          content += `\n${sleepGql}`;
        }
        content += `\n\n# Create Index: \n${indexes.map(i => i.replaceAll('\n', '')).join(';\n')};`;
      }
      setDDL(content);
    }
    setLoading(false);
  }, [space]);
  const handleCopy = useCallback(() => {
    message.success(intl.get('common.copySuccess'));
  }, []);

  const handleDownload = useCallback(() => {
    let url = '#';
    const _utf = '\uFEFF';
    if (window.Blob && window.URL && window.URL.createObjectURL) {
      const csvBlob = new Blob([_utf + ddl], {
        type: 'text/csv',
      });
      url = URL.createObjectURL(csvBlob);
    }
    url = 'data:attachment/csv;charset=utf-8,' + _utf + encodeURIComponent(ddl);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${space}_ddl.ngql`;
    link.click();
  }, [space, ddl]);
  useEffect(() => {
    !visible && setDDL('');
  }, [visible]);
  return (
    <>
      <Button type="link" onClick={handleOpen}>
        {intl.get('schema.showDDL')}
      </Button>
      <Modal
        className={styles.ddlModal}
        destroyOnClose={true}
        open={visible}
        width={'60%'}
        bodyStyle={{ minHeight: 200 }}
        onCancel={() => setVisible(false)}
        title={intl.get('schema.showDDL')}
        footer={
          !loading && <div className={styles.footer}>
            <Button
              key="confirm"
              type="primary"
              onClick={handleDownload}
            >
              {intl.get('schema.downloadNGQL')}
            </Button>
          </div>
        }
      >
        <Spin spinning={loading}>
          {!loading && <div className={styles.modalItem}>
            <CopyToClipboard key={1} text={ddl} onCopy={handleCopy}>
              <Button className={styles.duplicateBtn} key="confirm" icon={<Icon type="icon-Duplicate" />}>
                {intl.get('common.duplicate')}
              </Button>
            </CopyToClipboard>
            <CodeMirror
              value={ddl}
              options={options}
            />
          </div>}
        </Spin>
      </Modal>
    </>
  );
};

export default observer(DDLButton);
