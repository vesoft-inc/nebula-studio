import { Button, Col, Form, Input, Row, Spin, message } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import './index.less';
import { useStore } from '@app/stores';
import { convertBigNumberToString } from '@app/utils/function';
import { IAlterForm, IProperty, ISchemaType } from '@app/interfaces/schema';
import { trackPageView } from '@app/utils/stat';
import TTLForm from './TTLForm';
import PropertiesForm from './PropertiesForm';

const formItemLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 16,
  },
};

interface IPropertyItem {
  Default: any;
  Field: string;
  Null: string;
  Type: string;
  Comment: string;
}

interface IData {
  name: string;
  comment: string;
  properties: IProperty[],
  ttlConfig: {
    duration: string,
    col: string
  }
}
interface IProps {
  editType: ISchemaType
}
const ConfigEdit = (props: IProps) => {
  const { editType } = props;
  const { state } = useLocation();
  const history = useHistory();
  const [editName, setEditName] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const { schema: { getTagOrEdgeDetail, getTagOrEdgeInfo, alterField, getIndexTree } } = useStore();
  const [tempComment, setTempComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IData>({
    name: '',
    comment: '',
    properties: [],
    ttlConfig: {
      col: '',
      duration: ''
    }
  } as IData);
  const [ttlRequired, setTtlRequired] = useState(false);
  const [propertiesRequired, setPropertiesRequired] = useState(false);
  useEffect(() => {
    trackPageView(`/schema/${editType}/edit`);
    getDetails();
  }, []);

  const getDetails = async () => {
    const _editName = state[editType];
    if(!_editName) {
      history.push(`/schema/${editType}/list`);
    }
    setEditName(_editName);
    setLoading(true);
    const { code, data } = await getTagOrEdgeDetail(editType, _editName);
    const { code: propCode, data: propData } = await getTagOrEdgeInfo(
      editType,
      _editName,
    );
    setLoading(false);
    if (code === 0) {
      const key = editType === 'tag' ? 'Create Tag' : 'Create Edge';
      const info = data.tables[0][key];
      const fieldInfo = propCode === 0 ? propData.tables : [];
      handleData(_editName, info, fieldInfo);
    }
  };

  const handleData = (name: string, data: string, fieldInfo: IPropertyItem[]) => {
    const reg = /CREATE (?:TAG|EDGE)\s`.+`\s\((.*)\)\s+(ttl_duration = \d+),\s+(ttl_col = ".*?")(, comment = ".*")?/gm;
    const str = data.replace(/[\r\n]/g, ' ');
    const infoList = reg.exec(str) || [];
    const properties: IProperty[] = fieldInfo.map(i => ({
      name: i.Field,
      showType: i.Type,
      type: i.Type.startsWith('fixed_string') ? 'fixed_string' : i.Type,
      allowNull: i.Null === 'YES',
      comment: i.Comment === '_EMPTY_' ? '' : i.Comment,
      value: i.Default === '_EMPTY_' ? '' : convertBigNumberToString(i.Default),
      fixedLength: i.Type.startsWith('fixed_string')
        ? i.Type.replace(/[fixed_string(|)]/g, '')
        : '',
    })) || [];
    const duration = infoList[2]?.split(' = ')[1] || '';
    const col = infoList[3]?.split(' = ')[1].replace(/"/g, '') || '';
    const comment = infoList[4]?.split(' = ')[1].slice(1, -1) || '';
    const propertiesRequired = properties.length > 0;
    const ttlRequired = col !== '';
    setPropertiesRequired(propertiesRequired);
    setTtlRequired(ttlRequired);
    setData({
      name,
      comment,
      properties,
      ttlConfig: {
        col,
        duration
      }
    });
    setTempComment(comment);
  };

  const handleCommentEditStart = () => {
    setEditKey('comment');
    setTempComment(data.comment);
  };

  const handleAlter = async (config: IAlterForm) => {
    setLoading(true);
    const res = await alterField(config);
    setLoading(false);
    if (res.code === 0) {
      message.success(intl.get('common.updateSuccess'));
      await getDetails();
      setEditKey(null);
    }
  };
  const handleCommentUpdate = async () => {
    setLoading(true);
    await handleAlter({
      type: editType,
      name: editName,
      action: 'COMMENT',
      config: {
        comment: tempComment,
      },
    });
    setLoading(false);
  };

  const handleCommentCancel = () => {
    setEditKey(null);
    setTempComment(data.comment);
  };
  const checkIndex = async () => {
    setLoading(true);
    const res = (await getIndexTree(editType)) || [];
    setLoading(false);
    const hasIndex = res.some(i => i.name === editName);
    return hasIndex;
  };
  return (
    <div className="config-edit-group">
      <Spin delay={400} spinning={loading}>
        <Form
          className="basic-config" 
          layout="vertical" 
          {...formItemLayout}>
          <Form.Item noStyle shouldUpdate={true}>
            <Row className="form-item">
              <Col span={12}>
                <Form.Item label={intl.get('common.name')}>
                  <Input value={editName} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={intl.get('common.comment')}>
                  <Input
                    disabled={editKey !== 'comment'}
                    className="input-comment"
                    defaultValue={data.comment}
                    value={tempComment}
                    onChange={e => setTempComment(e.target.value)}
                  />
                  {editKey !== 'comment' ? (
                    <>
                      <Button
                        disabled={editKey !== null}
                        type="link"
                        onClick={handleCommentEditStart}
                      >
                        {intl.get('common.edit')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="link"
                        onClick={handleCommentUpdate}
                      >
                        {intl.get('common.ok')}
                      </Button>
                      <Button
                        type="link"
                        danger
                        onClick={handleCommentCancel}
                      >
                        {intl.get('common.cancel')}
                      </Button>
                    </>
                  )}
                  
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
        </Form>
        <PropertiesForm
          editType={editType}
          editDisabled={editKey !== null}
          onBeforeEdit={(index) => setEditKey(index !== null ? `properties[${index}]` : null)}
          initialRequired={propertiesRequired}
          onEdit={handleAlter} 
          data={data} />
        <TTLForm 
          editType={editType}
          editDisabled={editKey !== null}
          initialRequired={ttlRequired} 
          data={data}
          onEdit={handleAlter}
          checkIndex={checkIndex} 
          onBeforeEdit={(type?: null) => setEditKey(type === null ? null : 'ttl')}
        />
      </Spin>
    </div>
  );
};

export default observer(ConfigEdit);
