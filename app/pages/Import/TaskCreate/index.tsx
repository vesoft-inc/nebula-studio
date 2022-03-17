import { Button, Col, Form, Input, Row, Select, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Breadcrumb from '@app/components/Breadcrumb';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { configToJson } from '@app/utils/import';
import intl from 'react-intl-universal';
import './index.less';
import { useHistory } from 'react-router-dom';
import { POSITIVE_INTEGER_REGEX } from '@app/utils/constant';
import PasswordInputModal from './PasswordInputModal';
import SchemaConfig from './SchemaConfig';
import FileSelect from './FileSelect';
const Option = Select.Option;
const formItemLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 11,
  },
};
const TaskCreate = () => {
  const { dataImport, schema, global } = useStore();
  const { taskDir, getTaskDir, basicConfig, verticesConfig, edgesConfig, updateBasicConfig, importTask } = dataImport;
  const { spaces, spaceVidType, getSpaces, updateSpaceInfo, currentSpace } = schema;
  const { host, username } = global;
  const { batchSize } = basicConfig;
  const [modalVisible, setVisible] = useState(false);
  const history = useHistory();
  const routes = [
    {
      path: '/import/tasks',
      breadcrumbName: intl.get('import.taskList'),
    },
    {
      path: '#',
      breadcrumbName: intl.get('import.createTask'),
    },
  ];

  const openPasswordModal = () => {
    try {
      check();
      setVisible(true);
    } catch (err) {
      console.log('err', err);
    }
  };
  const handleStartImport = async (password?: string) => {
    setVisible(false);
    if(password) {
      const config: any = configToJson({ 
        ...basicConfig,
        space: currentSpace,
        taskDir,
        verticesConfig, 
        edgesConfig, 
        host, 
        username,
        password,
        spaceVidType });
      const code = await importTask(config, basicConfig.taskName);
      if(code === 0) {
        message.success(intl.get('import.startImporting'));
        history.push('/import/tasks');
      }
    }
  };


  const check = () => {
    verticesConfig.forEach(config => {
      if(config.idMapping === null) {
        message.error(`vertexId ${intl.get('import.indexNotEmpty')}`);
        throw new Error();
      }
      if(config.tags.length === 0) {
        message.error(`Tag Mapping ${intl.get('import.isEmpty')}`);
        throw new Error();
      }
      config.tags.forEach(tag => {
        if (!tag.name) {
          message.error(`Tag ${intl.get('import.isEmpty')}`);
          throw new Error();
        }
        tag.props.forEach(prop => {
          if (prop.mapping === null && !prop.isDefault) {
            message.error(`${prop.name} ${intl.get('import.indexNotEmpty')}`);
            throw new Error();
          }
        });
      });
    });
    edgesConfig.forEach(edge => {
      if (!edge.type) {
        message.error(`edgeType ${intl.get('import.isEmpty')}`);
        throw new Error();
      }
      edge.props.forEach(prop => {
        if (prop.mapping === null && prop.name !== 'rank' && !prop.isDefault) {
          message.error(`${prop.name} ${intl.get('import.indexNotEmpty')}`);
          throw new Error();
        }
      });
    });
    if(batchSize && !batchSize.match(POSITIVE_INTEGER_REGEX)) {
      message.error(`${intl.get('import.batchSize')} ${intl.get('formRules.numberRequired')}`);
      throw new Error();
    }
  };

  const clearConfig = () => {
    dataImport.update({
      basicConfig: { taskName: '' },
      verticesConfig: [],
      edgesConfig: []
    });
  };
  const handleSpaceChange = (space: string) => {
    clearConfig();
    updateSpaceInfo(space);
  };

  useEffect(() => {
    getTaskDir();
    getSpaces();
    if(currentSpace) {
      updateSpaceInfo(currentSpace);
    }
    trackPageView('/import/create');
    return () => clearConfig();
  }, []);
  return (
    <div className="nebula-import-create">
      <Breadcrumb routes={routes} />
      <div className="create-form center-layout">
        <Form className="basic-config" layout="vertical" {...formItemLayout}>
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
                <Input value={basicConfig.taskName} onChange={e => updateBasicConfig('taskName', e.target.value)} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item label={intl.get('import.batchSize')} name="batchSize" rules={[{
                pattern: POSITIVE_INTEGER_REGEX,
                message: intl.get('formRules.numberRequired'),
              }]}>
                <Input placeholder="60" value={basicConfig.batchSize} onChange={e => updateBasicConfig('batchSize', e.target.value)} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <div className="map-config">
          <Form className="config-column" layout="vertical">
            <Form.Item label={intl.get('import.vertices')} required={true}>
              <div className="container">
                <FileSelect type="vertices" />
                {verticesConfig.map((item, index) => <SchemaConfig type="vertices" key={item.name} data={item} configIndex={index} />)}
              </div>
            </Form.Item>
          </Form>
          <Form className="config-column" layout="vertical">
            <Form.Item label={intl.get('import.edge')} required={true}>
              <div className="container">
                <FileSelect type="edge" />
                {edgesConfig.map((item, index) => <SchemaConfig type="edge" key={item.name} data={item} configIndex={index} />)}
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
      <div className="studio-form-footer">
        <Button onClick={() => history.push('/import/tasks')}>{intl.get('common.cancel')}</Button>
        <Button type="primary" disabled={
          basicConfig.taskName === ''
          || (!verticesConfig.length && !edgesConfig.length)
        } onClick={openPasswordModal}>{intl.get('import.runImport')}</Button>
      </div>
      <PasswordInputModal visible={modalVisible} onConfirm={handleStartImport} />
    </div>
  );
};

export default observer(TaskCreate);
