import { Button, Carousel, Col, Row } from 'antd';
import React, { useEffect } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { trackPageView } from '@app/utils/stat';
import Icon from '@app/components/Icon';
import { chunk } from 'lodash';
import cls from 'classnames';
import { useHistory } from 'react-router-dom';
import styles from './index.module.less';

const MODULES = [
  {
    icon: 'icon-studio-nav-schema',
    title: 'common.schema',
    tip: 'doc.schemaIntro',
    link: '/schema'
  },
  {
    icon: 'icon-studio-nav-import',
    title: 'import.importData',
    tip: 'doc.importIntro',
    link: '/import/files'
  },
  {
    icon: 'icon-studio-nav-console',
    title: 'common.console',
    tip: 'doc.consoleIntro',
    link: '/console'
  },
];

const DOCS = [
  {
    title: 'doc.getStarted',
    tip: 'doc.getStartedTip',
    link: 'link.mannualHref'
  },
  {
    title: 'doc.useGuide',
    tip: 'doc.useGuideTip',
    link: 'link.startStudioHref'
  },
  {
    title: 'doc.ngqlIntro',
    tip: 'doc.ngqlIntroTip',
    link: 'link.nGQLHref'
  },
];

const DocPage = () => {
  const history = useHistory();
  const docGroup = chunk(DOCS, 3);
  useEffect(() => {
    trackPageView('/doc');
  }, []);
  
  return (
    <div className={cls(styles.studioDoc, 'studioCenterLayout')}>
      <h1 className={styles.welcomeLabel}>{intl.get('doc.welcome')} <span>NebulaGraph Studio</span></h1>
      <div className={styles.docBox}>
        <div className={styles.header}>{intl.get('doc.functionIntro')}</div>
        <div className={styles.moduleIntro}>
          {MODULES.map(module => <Col span={8} key={module.title}>
            <div className={styles.moduleItem} onClick={() => history.push(module.link)}>
              <Icon type={module.icon} />
              <span className={styles.title}>{intl.get(module.title)}</span>
              <span className={styles.tip}>{intl.get(module.tip)}</span>
            </div>
          </Col>)}
        </div>
      </div>
      <div className={styles.docBox}>
        <div className={styles.header}>{intl.get('doc.learningDoc')}</div>
        <div className={styles.docCarousel}>
          <Carousel dotPosition="bottom" lazyLoad="progressive" dots={{ className: 'btn-carousel' }}>
            {docGroup.map((group, index) => (
              <Row className={styles.docGroup} gutter={26} key={index}>
                {group.map(doc => <Col span={8} key={doc.title}>
                  <div className={styles.docItem}>
                    <div className={styles.docDesc}>
                      <p className={styles.docTitle}>{intl.get(doc.title)}</p>
                      <p className={styles.docTip}>{intl.get(doc.tip)}</p>
                    </div>
                    <Button type="primary">
                      <a href={intl.get(doc.link)} target="_blank" rel="noreferrer">
                        {intl.get('doc.start')}
                      </a>
                    </Button>
                  </div>
                </Col>)}
              </Row>
            ))}
          </Carousel>
        </div>
      </div>
    </div>
  );
};
export default observer(DocPage);
