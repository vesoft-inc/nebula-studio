import { Button, Carousel, Col, Row } from 'antd';
import React, { useEffect } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { trackPageView } from '@app/utils/stat';
import Icon from '@app/components/Icon';
import { chunk } from 'lodash';

import './index.less';
import { useHistory } from 'react-router-dom';

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
    <div className="studio-doc center-layout">
      <h1 className="welcome-label">{intl.get('doc.welcome')} <span>Nebula Studio</span></h1>
      <div className="doc-box">
        <div className="header">{intl.get('doc.functionIntro')}</div>
        <div className="module-intro">
          {MODULES.map(module => <Col span={8} key={module.title}>
            <div className="module-item" onClick={() => history.push(module.link)}>
              <Icon type={module.icon} />
              <span className="title">{intl.get(module.title)}</span>
              <span className="tip">{intl.get(module.tip)}</span>
            </div>
          </Col>)}
        </div>
      </div>
      <div className="doc-box">
        <div className="header">{intl.get('doc.learningDoc')}</div>
        <div className="doc-carousel">
          <Carousel dotPosition="bottom" lazyLoad="progressive" dots={{ className: 'btn-carousel' }}>
            {docGroup.map((group, index) => (
              <Row className="doc-group" gutter={26} key={index}>
                {group.map(doc => <Col span={8} key={doc.title}>
                  <div className="doc-item">
                    <div className="doc-desc">
                      <p className="doc-title">{intl.get(doc.title)}</p>
                      <p className="doc-tip">{intl.get(doc.tip)}</p>
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
