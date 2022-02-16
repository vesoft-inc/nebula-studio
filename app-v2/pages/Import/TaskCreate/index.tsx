import { Button, Form, Select, Input, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import Breadcrumb from '@appv2/components/Breadcrumb';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import { trackPageView } from '@appv2/utils/stat';
import FileSelect from './FileSelect';
import SchemaConfig from './SchemaConfig';
import PasswordInputModal from './PasswordInputModal';
import { configToJson } from '@appv2/utils/import';
import intl from 'react-intl-universal'
import './index.less';
import { useHistory } from 'react-router-dom';
import { POSITIVE_INTEGER_REGEX } from '@appv2/utils/constant'
const Option = Select.Option;

const TaskCreate = () => {
  const { dataImport, schema, global } = useStore();
  const { taskDir, asyncGetTaskDir, basicConfig, verticesConfig, edgesConfig, updateBasicConfig, importTask } = dataImport;
  const { spaces, spaceVidType, getSpaces, updateSpaceInfo, currentSpace } = schema;
  const { host, username } = global;
  const [modalVisible, setVisible] = useState(false)
  const history = useHistory()
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
      check()
      setVisible(true)
    } catch (err) {
      console.log('err', err)
    }
  }
  const handleStartImport = async (password?: string) => {
    if(password) {
      const config: any = configToJson({ 
        ...basicConfig,
        space: currentSpace,
        taskDir,
        verticesConfig: verticesConfig, 
        edgesConfig: edgesConfig, 
        host, 
        username,
        password,
        spaceVidType });
      const code = await importTask(config, basicConfig.taskName);
      if(code === 0) {
        message.success('import.startImporting')
        history.push('/import/tasks')
      }
    }
    setVisible(false);
  }


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
      })
    })
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
    })
    if(basicConfig.batchSize && !POSITIVE_INTEGER_REGEX.test(basicConfig.batchSize)) {
      message.error(`${intl.get('import.batchSize')} ${intl.get('formRules.numberRequired')}`);
      throw new Error();
    }
  }

  const clearConfig = () => {
    dataImport.update({
      basicConfig: { taskName: '' },
      verticesConfig: [],
      edgesConfig: []
    })
  }
  useEffect(() => {
    asyncGetTaskDir();
    getSpaces();
    if(currentSpace) {
      updateSpaceInfo(currentSpace)
    }
    trackPageView('/import/create');
    return () => clearConfig();
  }, [])
  return (
    <div className="nebula-import-create">
      <Breadcrumb routes={routes} />
      <div className="create-form">
        <Form className='basic-config' layout='vertical'>
          <Form.Item label={intl.get('common.space')} required={true}>
            <Select value={currentSpace} onChange={value => updateSpaceInfo(value)}>
              {spaces.map(space => (
                <Option value={space} key={space}>
                  {space}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={intl.get('import.taskName')} required={true}>
            <Input value={basicConfig.taskName} onChange={e => updateBasicConfig('taskName', e.target.value)} />
          </Form.Item>
          <Form.Item label={intl.get('import.batchSize')} name='batchSize' rules={[{
             pattern: POSITIVE_INTEGER_REGEX,
             message: intl.get('formRules.numberRequired'),
          }]}>
            <Input placeholder='60' value={basicConfig.batchSize} onChange={e => updateBasicConfig('batchSize', e.target.value)} />
          </Form.Item>
        </Form>
        <div className='map-config'>
          <Form className='config-column' layout='vertical'>
            <Form.Item label={intl.get('import.vertices')} required={true}>
              <div className='container'>
                <FileSelect type='vertices' />
                {verticesConfig.map((item, index) => <SchemaConfig type='vertices' key={item.name} data={item} configIndex={index} />)}
              </div>
            </Form.Item>
          </Form>
          <Form className='config-column' layout='vertical'>
            <Form.Item label={intl.get('import.edge')} required={true}>
              <div className='container'>
                <FileSelect type='edge' />
                {edgesConfig.map((item, index) => <SchemaConfig type='edge' key={item.name} data={item} configIndex={index} />)}
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
      <div className='footer'>
        <Button onClick={() => history.push('/import/tasks')}>{intl.get('common.cancel')}</Button>
        <Button type='primary' disabled={
          basicConfig.taskName === ''
          || (!verticesConfig.length && !edgesConfig.length)
        } onClick={openPasswordModal}>{intl.get('import.runImport')}</Button>
      </div>
      <PasswordInputModal visible={modalVisible} onConfirm={handleStartImport} />
    </div>
  );
};

export default observer(TaskCreate);
