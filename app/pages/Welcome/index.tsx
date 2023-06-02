import { useCallback, useEffect, useMemo } from 'react';
import { Button, Carousel, Checkbox, Col, message, Modal, Progress, Row, Tabs, TabsProps, Tag, Tooltip } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { useI18n, getI18n } from '@vesoft-inc/i18n';
import { observer } from 'mobx-react-lite';
import debounce from 'lodash/debounce';
import { useHistory } from 'react-router-dom';
import type { History } from 'history';
import cls from 'classnames';
import { useStore } from '@app/stores';
import Icon from '@app/components/Icon';
import { trackPageView } from '@app/utils/stat';
import service from '@app/config/service';
import { useBatchState } from '@app/utils';
import styles from './index.module.less';

export interface ModuleItem {
  icon: string;
  title: string;
  tip: string;
  startLink: string;
  startDisabled?: boolean;
  disabledTip?: string;
  docLink: string;
  beta?: boolean;
  withOrder?: boolean;
}

const { intl } = getI18n();

export const getModuleList = (): ModuleItem[] => {
  return [
    {
      icon: 'icon-studio-nav-schema',
      title: intl.get('common.schema'),
      tip: intl.get('doc.schemaIntro'),
      startLink: '/schema',
      docLink: intl.get('welcome.schemaModuleLink'),
    },
    {
      icon: 'icon-studio-nav-import',
      title: intl.get('import.importData'),
      tip: intl.get('doc.importIntro'),
      startLink: '/import/tasks',
      docLink: intl.get('welcome.importModuleLink'),
    },
    {
      icon: 'icon-studio-nav-console',
      title: intl.get('common.console'),
      tip: intl.get('doc.consoleIntro'),
      startLink: '/console',
      docLink: intl.get('welcome.consoleModuleLink'),
    },
    {
      icon: 'icon-navbar-sketch',
      title: intl.get('common.sketch'),
      tip: intl.get('doc.sketchIntro'),
      startLink: '/sketch',
      docLink: intl.get('welcome.sketchModuleLink'),
    },
  ];
};

export type DatasetType = 'starter' | 'solution';

export interface DatasetItem {
  type: DatasetType;
  tags?: string[];
  description: string;
  spaceName: string;
  fileName: string;
  rename?: string;
  detail: {
    vertexCount: number;
    edgeCount: number;
  };
  coverImg: string;
  docLink?: string;
}

export interface DocItem {
  title: string;
  tip: string;
  link: string;
}

export const getDocList = (): DocItem[] => {
  return [
    {
      title: intl.get('doc.getStarted'),
      tip: intl.get('doc.getStartedTip'),
      link: intl.get('link.mannualHref'),
    },
    {
      title: intl.get('doc.useGuide'),
      tip: intl.get('doc.useGuideTip'),
      link: intl.get('link.startStudioHref'),
    },
    {
      title: intl.get('doc.ngqlIntro'),
      tip: intl.get('doc.ngqlIntroTip'),
      link: intl.get('link.nGQLHref'),
    },
  ];
};

export const shouldAlwaysShowWelcome = () => localStorage.getItem('showWelcome') !== 'false';

const getDatasetList = (): DatasetItem[] => {
  return [
    {
      type: 'starter',
      tags: ['starter'],
      description: intl.get('doc.basketballplayerIntro'),
      spaceName: 'demo_basketballplayer',
      fileName: 'basketballplayer',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 81,
        edgeCount: 227,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/basketballplayer.png`,
      docLink: intl.get('welcome.basketballplayerDocLink'),
    },
    {
      type: 'solution',
      tags: ['solution'],
      description: intl.get('doc.shareholdingIntro'),
      spaceName: 'demo_shareholding',
      fileName: 'shareholding',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 5500,
        edgeCount: 13130,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/shareholding.png`,
      docLink: intl.get('welcome.shareholdingDocLink'),
    },
    {
      type: 'starter',
      tags: ['starter'],
      description: intl.get('doc.snsIntro'),
      spaceName: 'demo_sns',
      fileName: 'sns',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 125,
        edgeCount: 327,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/sns.png`,
      docLink: intl.get('welcome.snsDocLink'),
    },
    {
      type: 'solution',
      tags: ['solution'],
      description: intl.get('doc.openstackIntro'),
      spaceName: 'demo_ai_ops',
      fileName: 'openstack',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 36,
        edgeCount: 50,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/openstack.png`,
      docLink: intl.get('welcome.openstackDocLink'),
    },
    {
      type: 'starter',
      tags: ['starter'],
      description: intl.get('doc.datalineageIntro'),
      spaceName: 'demo_data_lineage',
      fileName: 'datalineage',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 243,
        edgeCount: 550,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/datalineage.png`,
      docLink: intl.get('welcome.datalineageDocLink'),
    },
    {
      type: 'starter',
      tags: ['starter'],
      description: intl.get('doc.movieIntro'),
      spaceName: 'demo_movie_recommendation',
      fileName: 'movie',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 47766,
        edgeCount: 160000,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/movie.png`,
      docLink: intl.get('welcome.movieDocLink'),
    },
    {
      type: 'starter',
      tags: ['starter'],
      description: intl.get('doc.idMappingIntro'),
      spaceName: 'demo_identity_resolution',
      fileName: 'id_mapping',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 91,
        edgeCount: 133,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/id_mapping.png`,
      docLink: intl.get('welcome.idMappingDocLink'),
    },
    {
      type: 'solution',
      tags: ['solution'],
      description: intl.get('doc.fraudDetectionIntro'),
      spaceName: 'demo_fraud_detection',
      fileName: 'fraud_detection',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 1076,
        edgeCount: 427,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/fraud_detection.png`,
      docLink: intl.get('welcome.fraudDetectionDocLink'),
    },
    {
      type: 'starter',
      tags: ['starter'],
      description: intl.get('doc.fifa2022Intro'),
      spaceName: 'demo_football_2022',
      fileName: 'fifa2022',
      rename: undefined as unknown as string,
      detail: {
        vertexCount: 1166,
        edgeCount: 1695,
      },
      coverImg: `${process.env.CDN_PATH || '/'}images/welcome/fifa2022.png`,
      docLink: intl.get('welcome.fifa2022DocLink'),
    },
  ];
};

const initLoadingTime = 21;

interface IProps {
  datasetList?: DatasetItem[];
  moduleList?: ModuleItem[];
  docList?: DocItem[];
  product?: string;
  onDatasetLoad?: (spaceName: string) => void;
  onClosePage?: () => void;
}

function Welcome(props: IProps) {
  const {
    datasetList = getDatasetList(),
    moduleList = getModuleList(),
    docList = getDocList(),
    onDatasetLoad,
    product = `${window.gConfig.databaseName} Studio`,
    onClosePage,
  } = props;
  const history = useHistory() as History;
  const { welcome } = useStore();
  const { intl } = useI18n();
  const { spaceLoading, setSpaceLoading, clearSpaceLoadingTimeout } = welcome;
  const { state, setState } = useBatchState({
    datasetType: 'starter' as DatasetType,
    actionShow: shouldAlwaysShowWelcome(),
  });
  const { datasetType, actionShow } = state;

  const tabItems: TabsProps['items'] = [
    {
      key: 'starter',
      label: intl.get('welcome.starterDatasets'),
      className: styles.tabPane,
      children: null,
    },
    {
      key: 'solution',
      label: intl.get('welcome.solutionDatasets'),
      className: styles.tabPane,
      children: null,
    },
  ];

  const docGroup = useMemo(
    () =>
      docList.reduce((ret, item, idx) => {
        const groupIdx = Math.floor(idx / 3);
        ret[groupIdx] = (ret[groupIdx] || []).concat(item);
        return ret;
      }, [] as DocItem[][]),
    [docList],
  );

  const downloadDemo = useCallback(
    debounce(async (space: DatasetItem) => {
      const showSpaceRes = await service.execNGQL({ gql: 'show spaces;' });
      if (showSpaceRes?.code !== 0) {
        return;
      }
      if (showSpaceRes.data?.tables.some((s) => s.Name === space.spaceName)) {
        message.error(intl.get('welcome.spaceExist', { space: space.spaceName }));
        return;
      }
      const gql = await fetch(`${process.env.CDN_PATH || '/'}datasets/${space.fileName}.ngql`).then((r) => r.text());
      setSpaceLoading({ spaceName: space.spaceName, leftTime: initLoadingTime, progressModalOpen: true });
      const downloadRes = await service.batchExecNGQL({
        gqls: gql.split('\n').map(line => line.startsWith(':') ? line.replace(/;$/gm, '') : line).filter(Boolean)
      });
      setSpaceLoading({ spaceName: undefined, leftTime: 0, progressModalOpen: false });
      clearSpaceLoadingTimeout();
      if (downloadRes?.code === 0) {
        message.success(intl.get('welcome.downloadSuccess', { space: space.spaceName }));
        typeof onDatasetLoad === 'function'
          ? onDatasetLoad(space.spaceName)
          : history.push({ pathname: '/schema', hash: `#${space.spaceName}` });
      }
    }, 200),
    [],
  );

  const onShowPageCheckboxChange = useCallback((e: CheckboxChangeEvent) => {
    const actionShow = e.target.checked;
    setState({ actionShow });
    localStorage.setItem('showWelcome', `${actionShow}`);
  }, []);

  const closePageHandler = useCallback(() => {
    typeof onClosePage === 'function' ? onClosePage() : history.replace('/console');
  }, [onClosePage]);

  useEffect(() => {
    spaceLoading.spaceName && setSpaceLoading({ progressModalOpen: true });
    trackPageView('/welcome');
  }, []);

  const getTabItem = (datasetType: DatasetType) => (
    <Row className={styles.moduleIntro} gutter={[26, 26]}>
      {datasetList
        .filter((i) => i.type === datasetType)
        .map((dataset) => (
          <Col span={8} key={dataset.spaceName}>
            <div className={cls(styles.moduleItem, styles.withCover)}>
              <div className={styles.cover} style={{ backgroundImage: `url(${dataset.coverImg})` }} />
              <div className={styles.withCoverContent}>
                <div className={styles.contentHeader}>
                  <div className={styles.tagWrapper}>
                    {dataset.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                  <div className={styles.infoWrapper}>
                    <span>
                      {`${intl.get('import.edgeText')}: `}
                      <strong>{dataset.detail.edgeCount}</strong>
                    </span>
                    <span>
                      {`${intl.get('import.vertexText')}: `}
                      <strong>{dataset.detail.vertexCount}</strong>
                    </span>
                  </div>
                </div>
                <div className={styles.contentTitle}>{dataset.spaceName}</div>
                <div className={styles.contentDescription}>
                  <span className={styles.descInner}>{dataset.description}</span>
                </div>
                <div className={styles.contentFooter}>
                  <div className={styles.actionWrapper}>
                    <Button
                      className={cls(styles.action, styles.sub)}
                      onClick={() => downloadDemo(dataset)}
                      disabled={!!spaceLoading.spaceName}
                    >
                      {intl.get('welcome.demoDownload')}
                    </Button>
                    <Button
                      className={styles.link}
                      disabled={!dataset.docLink}
                      href={dataset.docLink}
                      target="_blank"
                      type="link"
                    >
                      {intl.get('welcome.demoIntro')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ))}
    </Row>
  );

  // @ts-ignore
  const percent = (((initLoadingTime - spaceLoading?.leftTime) / initLoadingTime) * 100) | 0;
  const renderPercent = percent > 99 ? 99 : percent;

  return (
    <div className={styles.welcomeWrapper}>
      <div className={styles.welcomeHeader}>
        <div className={styles.headerAction}>
          <Checkbox checked={actionShow} onChange={onShowPageCheckboxChange}>
            {intl.get('welcome.alwaysShow')}
          </Checkbox>
          <Icon type="icon-studio-btn-close" className={styles.actionClose} onClick={closePageHandler} />
        </div>
        <h1 className={styles.welcomeLabel}>
          {intl.get('doc.welcome')}&nbsp;<span style={{ fontWeight: 'bold' }}>{product}</span>
        </h1>
      </div>
      <div className={styles.docBox}>
        <div className={styles.header}>{intl.get('doc.functionIntro')}</div>
        <Row className={styles.moduleIntro} gutter={[26, 26]}>
          {moduleList.map((module, idx) => (
            <Col span={8} key={module.title}>
              <div className={styles.moduleItem}>
                <Icon type={module.icon} />
                <span className={cls(styles.title, module.beta && styles.beta)}>{module.title}</span>
                <span className={styles.tip}>{module.tip}</span>
                <div className={styles.actionWrapper}>
                  {module.disabledTip ? (
                    <Tooltip title={module.disabledTip}>
                      <Button
                        className={styles.disabledAction}
                        disabled={!!module.startDisabled}
                        type="primary"
                        onClick={() => history.push(module.startLink)}
                      >
                        {intl.get('welcome.quickStart')}
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button
                      className={styles.action}
                      disabled={!!module.startDisabled}
                      type="primary"
                      onClick={() => history.push(module.startLink)}
                    >
                      {intl.get('welcome.quickStart')}
                    </Button>
                  )}

                  <Button className={cls(styles.action, styles.sub)} href={module.docLink} target="_blank">
                    {intl.get('welcome.quickStartDesc')}
                  </Button>
                </div>
                {module.withOrder && <div className={styles.order}>{idx + 1}</div>}
              </div>
            </Col>
          ))}
        </Row>
      </div>
      {!!datasetList?.length && (
        <div className={styles.docBox}>
          <div className={styles.header}>{intl.get('welcome.demos')}</div>
          <Tabs
            className={styles.tabTypeSet}
            tabBarGutter={0}
            animated={false}
            type="card"
            items={tabItems}
            activeKey={datasetType}
            onChange={(key) => setState({ datasetType: key as DatasetType })}
          />
          {getTabItem(datasetType)}
        </div>
      )}
      {!!docList?.length && (
        <div className={styles.docBox} style={{ paddingBottom: '24px' }}>
          <div className={styles.header}>{intl.get('doc.learningDoc')}</div>
          <Carousel dotPosition="bottom" lazyLoad="progressive">
            {docGroup.map((group, index) => (
              <div key={index}>
                <Row className={styles.docGroup} gutter={26}>
                  {group.map((doc) => (
                    <Col span={8} key={doc.title}>
                      <div className={styles.docItem}>
                        <div className={styles.docDesc}>
                          <p className={styles.docTitle}>{doc.title}</p>
                          <p className={styles.docTip}>{doc.tip}</p>
                        </div>
                        <Button type="primary" block>
                          <a href={doc.link} target="_blank" rel="noreferrer">
                            {intl.get('doc.start')}
                          </a>
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </Carousel>
        </div>
      )}
      <Modal
        footer={null}
        maskClosable={false}
        width={640}
        title={spaceLoading.spaceName || ''}
        open={spaceLoading.progressModalOpen}
        onCancel={() => setSpaceLoading({ progressModalOpen: false })}
        closable={false}
      >
        <div className={styles.progressWrapper}>
          <div className={styles.title}>
            <span>{intl.get('welcome.progressTitle')}</span>
            <span>{`${renderPercent}%`}</span>
          </div>
          <div className={styles.content}>
            <Progress percent={renderPercent} showInfo={false} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default observer(Welcome);
