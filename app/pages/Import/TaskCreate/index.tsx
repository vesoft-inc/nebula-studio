import { Button, Checkbox, Col, Form, Input, Row, Select, message } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Breadcrumb from '@app/components/Breadcrumb';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import cls from 'classnames';
import { useHistory } from 'react-router-dom';
import { DEFAULT_IMPORT_CONFIG, POSITIVE_INTEGER_REGEX } from '@app/utils/constant';
import { useI18n } from '@vesoft-inc/i18n';
import { ISchemaEnum, ISchemaType } from '@app/interfaces/schema';
import Icon from '@app/components/Icon';
import Instruction from '@app/components/Instruction';
import { isEmpty } from '@app/utils/function';
import styles from './index.module.less';
import ConfigConfirmModal from './ConfigConfirmModal';
import SchemaConfig from './SchemaConfig';
const Option = Select.Option;
const formItemLayout = {
  wrapperCol: {
    span: 15,
  },
};

interface IProps {
  needPwdConfirm?: boolean;
}


const AddMappingBtn = (props: { type: ISchemaType }) => {
  const { intl } = useI18n();
  const { type } = props;
  const { dataImport: { addTagConfig, addEdgeConfig } } = useStore();
  const addMapping = useCallback(() => type === ISchemaEnum.Tag ? addTagConfig() : addEdgeConfig(), [type]);
  return <Button type="primary" className="studioAddBtnIcon" onClick={addMapping}>
    <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />
    {intl.get(type === ISchemaEnum.Tag ? 'import.addTag' : 'import.addEdge')}
  </Button>;
};

const TaskCreate = (props: IProps) => {
  const { dataImport, schema, files, global, datasource } = useStore();
  const { intl, currentLocale } = useI18n();
  const { basicConfig, tagConfig, edgeConfig, updateBasicConfig, importTask } = dataImport;
  const { spaces, getSpaces, updateSpaceInfo, currentSpace } = schema;
  const { getGraphAddress, _host } = global;
  const { getFiles } = files;
  const [modalVisible, setVisible] = useState(false);
  const history = useHistory();
  const { needPwdConfirm = true } = props;
  const [address, setAddress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMoreConfig, setShowMoreConfig] = useState(false);
  const routes = useMemo(() => ([
    {
      path: '/import/tasks',
      breadcrumbName: intl.get('import.taskList'),
    },
    {
      path: '#',
      breadcrumbName: intl.get('import.createTask'),
    },
  ]), [currentLocale]);

  useEffect(() => {
    initTaskDir();
    getSpaces();
    getFiles();
    if(currentSpace) {
      updateSpaceInfo(currentSpace);
    }
    trackPageView('/import/create');
    return () => {
      clearConfig('all');
      datasource.update({ cachedStore: null });
    };
  }, []);

  const checkConfig = () => {
    try {
      check();
      needPwdConfirm ? setVisible(true) : handleStartImport();
    } catch (err) {
      console.log('err', err);
    }
  };
  const handleStartImport = async (password?: string) => {
    setVisible(false);
    setLoading(true);
    const code = await importTask({
      name: basicConfig.taskName, 
      password
    });
    setLoading(false);
    if(code === 0) {
      message.success(intl.get('import.startImporting'));
      history.push('/import/tasks');
    }
  };

  const check = () => {
    [...tagConfig, ...edgeConfig].forEach(config => {
      const { type, name, files } = config;
      const _type = type === ISchemaEnum.Tag ? 'tag' : 'edge';
      if(!name) {
        message.error(intl.get(`import.${_type}Required`));
        throw new Error();
      }
      if(files.length === 0) {
        message.error(intl.get(`import.${_type}FileRequired`));
        throw new Error();
      }
      files.forEach((file) => {
        if(!file.file?.name) {
          message.error(intl.get(`import.${_type}FileSelect`));
          throw new Error();
        }
        if(type === ISchemaEnum.Tag && isEmpty(file.vidIndex)) {
          message.error(`vertexId ${intl.get('import.indexNotEmpty')}`);
          throw new Error();
        } else if (type === ISchemaEnum.Edge) {
          if(isEmpty(file.srcIdIndex)) {
            message.error(`${intl.get('common.edge')} ${config.name} ${intl.get('common.src')} id ${intl.get('import.indexNotEmpty')}`);
            throw new Error();
          } else if (isEmpty(file.dstIdIndex)) {
            message.error(`${intl.get('common.edge')} ${config.name} ${intl.get('common.dst')} id ${intl.get('import.indexNotEmpty')}`);
            throw new Error();
          }
        }
        file.props.forEach(prop => {
          if (isEmpty(prop.mapping) && !prop.allowNull && !prop.isDefault) {
            message.error(`${prop.name} ${intl.get('import.indexNotEmpty')}`);
            throw new Error();
          }
        });
      });
    });
    extraConfigs.forEach(config => {
      const { key, label } = config;
      if(basicConfig[key] && !basicConfig[key].match(POSITIVE_INTEGER_REGEX)) {
        message.error(`${label}: ${intl.get('formRules.numberRequired')}`);
        throw new Error();
      }
    });
  };

  const clearConfig = useCallback((type?: string) => {
    const params = {
      tagConfig: [],
      edgeConfig: []
    } as any;
    if(type === 'all') {
      params.basicConfig = { taskName: '', address: address.map(i => i.value) };
    }
    dataImport.update(params);
  }, []);
  const handleSpaceChange = useCallback((space: string) => {
    clearConfig();
    updateSpaceInfo(space);
  }, []);

  const initTaskDir = useCallback(async () => {
    updateBasicConfig({ 'taskName': `task-${Date.now()}` });
    const graphs = await getGraphAddress();
    updateBasicConfig({ 'address': graphs });
    setAddress(graphs.map(item => ({
      label: <>
        {item}
        {item === _host ? <span className={styles.currentHost}>&nbsp;({intl.get('import.currentHost')})</span> : null}
      </>,
      value: item,
      disabled: item === _host
    })));
  }, []);
  const extraConfigs = useMemo(() => [
    {
      label: intl.get('import.concurrency'),
      key: 'concurrency',
      rules: [
        {
          pattern: POSITIVE_INTEGER_REGEX,
          message: intl.get('formRules.numberRequired'),
        },
      ],
      placeholder: DEFAULT_IMPORT_CONFIG.concurrency,
      description: intl.get('import.concurrencyTip'),
    },
    {
      label: intl.get('import.batchSize'),
      key: 'batchSize',
      rules: [
        {
          pattern: POSITIVE_INTEGER_REGEX,
          message: intl.get('formRules.numberRequired'),
        },
      ],
      placeholder: DEFAULT_IMPORT_CONFIG.batchSize,
      description: intl.get('import.batchSizeTip'),
    },
    {
      label: intl.get('import.retry'),
      key: 'retry',
      rules: [
        {
          pattern: POSITIVE_INTEGER_REGEX,
          message: intl.get('formRules.numberRequired'),
        },
      ],
      placeholder: DEFAULT_IMPORT_CONFIG.retry,
      description: intl.get('import.retryTip'),
    },
    {
      label: intl.get('import.readerConcurrency'),
      key: 'readerConcurrency',
      rules: [
        {
          pattern: POSITIVE_INTEGER_REGEX,
          message: intl.get('formRules.numberRequired'),
        },
      ],
      placeholder: DEFAULT_IMPORT_CONFIG.readerConcurrency,
      description: intl.get('import.readerConcurrencyTip'),
    },
    {
      label: intl.get('import.importerConcurrency'),
      key: 'importerConcurrency',
      rules: [
        {
          pattern: POSITIVE_INTEGER_REGEX,
          message: intl.get('formRules.numberRequired'),
        },
      ],
      placeholder: DEFAULT_IMPORT_CONFIG.importerConcurrency,
      description: intl.get('import.importerConcurrencyTip'),
    },
  ], [currentLocale]);
  return (
    <div className={styles.importCreate}>
      <Breadcrumb routes={routes} />
      <div className={cls(styles.createForm, 'studioCenterLayout')}>
        <Form className={styles.basicConfig} layout="vertical" {...formItemLayout}>
          <Row>
            <Col span={12}>
              <Form.Item label={intl.get('common.space')} required={true}>
                <Select value={currentSpace || null} placeholder={intl.get('console.selectSpace')} onChange={value => handleSpaceChange(value)}>
                  {spaces.map(space => (
                    <Option value={space} key={space}>
                      {space}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={intl.get('import.taskName')} required={true}>
                <Input value={basicConfig.taskName} onChange={e => updateBasicConfig({ 'taskName': e.target.value })} />
              </Form.Item>
            </Col>
          </Row>
          {showMoreConfig ? (
            <div className={styles.configContainer}>
              <Row>
                <Col span={24}>
                  <Form.Item label={<>
                    <span className={styles.label}>{intl.get('import.graphAddress')}</span>
                    <Instruction description={intl.get('import.graphAddressTip')} />
                  </>} rules={[{
                    required: true,
                  }]}>
                    <Checkbox.Group
                      className={styles.addressCheckbox}
                      options={address}
                      value={basicConfig.address}
                      onChange={value => updateBasicConfig({ 'address': value })}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row style={{ 'flexWrap': 'nowrap' }}>
                {extraConfigs.map(item => (
                  <Col span={5} key={item.key}>
                    <Form.Item label={<>
                      <span className={styles.label}>{item.label}</span>
                      <Instruction description={item.description} />
                    </>} name={item.key} rules={item.rules}>
                      <Input placeholder={item.placeholder.toString()} value={basicConfig[item.key]} onChange={e => updateBasicConfig(item.key, e.target.value)} />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
              <Row justify="center">
                <div className={styles.toggleConfigBtn} onClick={() => setShowMoreConfig(false)}>
                  <Icon type="icon-list-up" className={styles.toggleIcon} />
                  <span>{intl.get('import.pickUpConfig')}</span>
                </div>
              </Row>
            </div>
          ) : <Row justify="center">
            <div className={styles.toggleConfigBtn} onClick={() => setShowMoreConfig(true)}>
              <Icon type="icon-list-down" className={styles.toggleIcon} />
              <span>{intl.get('import.expandMoreConfig')}</span>
            </div>
          </Row>}
        </Form>
        <div className={styles.mapConfig}>
          <Form className={styles.configColumn} layout="vertical">
            <Form.Item label={intl.get('import.tag')} required={true}>
              <div className={styles.container}>
                <AddMappingBtn type={ISchemaEnum.Tag} />
                {tagConfig.map((item) => <SchemaConfig key={item._id} configItem={item} />)}
              </div>
            </Form.Item>
          </Form>
          <Form className={styles.configColumn} layout="vertical">
            <Form.Item label={intl.get('import.edge')} required={true}>
              <div className={styles.container}>
                <AddMappingBtn type={ISchemaEnum.Edge} />
                {edgeConfig.map((item) => <SchemaConfig key={item._id} configItem={item} />)}
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
      <div className="studioFormFooter">
        <Button onClick={() => history.push('/import/tasks')}>{intl.get('common.cancel')}</Button>
        <Button type="primary" disabled={
          basicConfig.taskName === ''
          || (!tagConfig.length && !edgeConfig.length)
        } onClick={checkConfig} loading={!needPwdConfirm && loading}>{intl.get('import.runImport')}</Button>
      </div>
      {modalVisible && <ConfigConfirmModal 
        needPwdConfirm={needPwdConfirm}
        visible={modalVisible} 
        onConfirm={handleStartImport} 
        onCancel={() => setVisible(false)}
      />}
    </div>
  );
};

export default observer(TaskCreate);
