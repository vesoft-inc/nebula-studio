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
      breadcrumbName: 'Task List',
    },
    {
      path: '#',
      breadcrumbName: 'Create New Import Task',
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
  const handleStartImport = (password?: string) => {
      if(password) {
        const config: any = configToJson({ 
          ...basicConfig,
          currentSpace,
          taskDir,
          verticesConfig: verticesConfig, 
          edgesConfig: edgesConfig, 
          host, 
          username,
          password,
          spaceVidType });
        importTask(config, basicConfig.taskName);
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
        message.error(`Tag Mapping is empty`);
        throw new Error();
      }
      config.tags.forEach(tag => {
        if (!tag.name) {
          message.error(`Tag is empty`);
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
        message.error(`edgeType is empty`);
        throw new Error();
      }
      edge.props.forEach(prop => {
        if (prop.mapping === null && prop.name !== 'rank' && !prop.isDefault) {
          message.error(`${prop.name} ${intl.get('import.indexNotEmpty')}`);
          throw new Error();
        }
      });
    })
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
          <Form.Item label="Space" required={true}>
            <Select value={currentSpace} onChange={value => updateSpaceInfo(value)}>
              {spaces.map(space => (
                <Option value={space} key={space}>
                  {space}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Task Name" required={true}>
            <Input value={basicConfig.taskName} onChange={e => updateBasicConfig('taskName', e.target.value)} />
          </Form.Item>
        </Form>
        <div className='map-config'>
          <Form className='config-column' layout='vertical'>
            <Form.Item label='Map Vertices' required={true}>
              <div className='container'>
                <FileSelect type='vertices' />
                {verticesConfig.map((item, index) => <SchemaConfig type='vertices' key={item.name} data={item} configIndex={index} />)}
              </div>
            </Form.Item>
          </Form>
          <Form className='config-column' layout='vertical'>
            <Form.Item label='Map Edges' required={true}>
              <div className='container'>
                <FileSelect type='edge' />
                {edgesConfig.map((item, index) => <SchemaConfig type='edge' key={item.name} data={item} configIndex={index} />)}
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
      <div className='footer'>
        <Button onClick={() => history.push('/import/tasks')}>Cancel</Button>
        <Button type='primary' disabled={
          Object.values(basicConfig).some(item => !item)
          || !verticesConfig.length
          || !edgesConfig.length
        } onClick={openPasswordModal}>Import</Button>
      </div>
      <PasswordInputModal visible={modalVisible} onConfirm={handleStartImport} />
    </div>
  );
};

export default observer(TaskCreate);
