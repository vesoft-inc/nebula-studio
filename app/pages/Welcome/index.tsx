import React, { useCallback, useEffect } from 'react';
import { Button, Checkbox, Col, message, Modal, Progress, Row, Tabs, TabsProps, Tag } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import intl from 'react-intl-universal';
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
  docLink: string;
  beta?: boolean;
  withOrder?: boolean;
}

export const getModuleList = (): ModuleItem[] => [
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
    startLink: '/import/files',
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

export type DatasetType = 'starter' | 'solution';

export interface DatasetItem {
  type: DatasetType;
  tags?: string[];
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

export const shouldAlwaysShowWelcome = () => localStorage.getItem('showWelcome') !== 'false';

const getDatasetList = (): DatasetItem[] => [
  {
    type: 'starter',
    tags: ['starter'],
    spaceName: 'demo-basketballplayer',
    fileName: 'basketballplayer',
    rename: undefined as unknown as string,
    detail: {
      vertexCount: 81,
      edgeCount: 233,
    },
    coverImg: `${process.env.CDN_PATH || ''}/images/welcome/basketballplayer.png`,
    docLink: intl.get('welcome.basketballplayerDocLink'),
  },
  {
    type: 'solution',
    tags: ['solution'],
    spaceName: 'demo-shareholding',
    fileName: 'shareholding',
    rename: undefined as unknown as string,
    detail: {
      vertexCount: 5500,
      edgeCount: 13150,
    },
    coverImg: `${process.env.CDN_PATH || ''}/images/welcome/shareholding.png`,
    docLink: intl.get('welcome.shareholdingDocLink'),
  },
];

const initLoadingTime = 21;

interface IProps {
  datasetList?: DatasetItem[];
  moduleList?: ModuleItem[];
  product?: string;
  onDatasetLoad?: (spaceName: string) => void;
  onClosePage?: () => void;
}

function Welcome(props: IProps) {
  const {
    datasetList = getDatasetList(),
    moduleList = getModuleList(),
    onDatasetLoad,
    product = 'NebulaGraph Studio',
    onClosePage,
  } = props;
  const history = useHistory() as History;
  const { welcome } = useStore();
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
      const gql = await fetch(`${process.env.CDN_PATH || ''}/datasets/${space.fileName}.ngql`).then((r) => r.text());
      setSpaceLoading({ spaceName: space.spaceName, leftTime: initLoadingTime, progressModalOpen: true });
      const downloadRes = await service.execSeqNGQL({
        gql: gql.replaceAll('\n', ''),
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
                <div className={styles.contentFooter}>
                  <div className={styles.actionWrapper}>
                    <Button
                      className={styles.action}
                      type="primary"
                      onClick={() => downloadDemo(dataset)}
                      disabled={!!spaceLoading.spaceName}
                    >
                      {intl.get('welcome.demoDownload')}
                    </Button>
                    <Button className={cls(styles.action, styles.sub)} href={dataset.docLink} target="_blank">
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
          {intl.get('doc.welcome')}&nbsp;<span>{product}</span>
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
                  <Button className={styles.action} type="primary" onClick={() => history.push(module.startLink)}>
                    {intl.get('welcome.quickStart')}
                  </Button>
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
      <div className={styles.docBox} style={{ paddingBottom: 36 }}>
        <div className={styles.header}>{intl.get('doc.functionIntro')}</div>
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
      <Modal
        footer={null}
        maskClosable={false}
        width={640}
        title={spaceLoading.spaceName || ''}
        open={spaceLoading.progressModalOpen}
        onCancel={() => setSpaceLoading({ progressModalOpen: false })}
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
