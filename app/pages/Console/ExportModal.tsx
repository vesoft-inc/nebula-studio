import { Button, Form, Input, Modal, Radio, Select } from 'antd';
import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';

import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';
const Option = Select.Option;

const layout = {
  labelCol: { span: 10 },
  wrapperCol: { span: 8 },
};

interface IProps {
  data: any;
  visible: boolean;
  onClose: () => void;
  onExplorer: (params: {
    space: string;
    vertexes: any[], 
    edges: any[]
  }) => void
}
const ExportModal = (props: IProps) => {
  const { data, visible, onClose, onExplorer } = props;
  const { schema: { currentSpace } } = useStore();
  const { headers, tables } = data;
  const { intl } = useI18n();
  const handleExport = (values) => {
    const { type, vertexId, srcId, dstId, edgeType, rank } = values;
    const vertexes =
      type === 'vertex'
        ? tables
          .map(vertex => {
            if (vertex.type === 'vertex') {
              return vertex.vid;
            } else {
              return vertex[vertexId].toString();
            }
          })
          .filter(vertexId => vertexId !== '')
        : tables
          .map(edge => [edge[srcId], edge[dstId]])
          .flat()
          .filter(id => id !== '');
    const edges =
      type === 'edge'
        ? tables
          .map(edge => ({
            srcId: edge[srcId],
            dstId: edge[dstId],
            rank: rank !== '' && rank !== undefined ? edge[rank] : 0,
            edgeType,
          }))
          .filter(edge => edge.srcId !== '' && edge.dstId !== '')
        : [];
    onExplorer({
      space: currentSpace,
      vertexes, 
      edges
    });
  };
  if(!data) {
    return;
  }
  return (
    <Modal
      className={styles.exportNodeModal}
      footer={null}
      width="650px"
      open={visible}
      onCancel={onClose}
    >
      <Form {...layout} onFinish={handleExport} initialValues={{
        type: 'vertex'
      }}>
        <Form.Item name="type" className={styles.selectType}>
          <Radio.Group className="studioTabGroup" buttonStyle="solid">
            <Radio.Button value="vertex">
              {intl.get('import.vertexText')}
            </Radio.Button>
            <Radio.Button value="edge">
              {intl.get('common.edge')}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle dependencies={['type']}>
          {({ getFieldValue }) => {
            const type = getFieldValue('type');
            return type === 'vertex' ? <>
              <p>{intl.get('console.exportVertex')}</p>
              <Form.Item label="vid" name="vertexId" rules={[{ required: true, message: intl.get('formRules.vidRequired') }]}>
                <Select>
                  {headers.map(i => (
                    <Option value={i} key={i}>
                      {i}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </> : <> 
              <p>{intl.get('console.exportEdge')}</p>
              <Form.Item label="Edge Type" name="edgeType" rules={[{ required: true, message: intl.get('formRules.edgeTypeRequired') }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Src ID" name="srcId" rules={[{ required: true, message: intl.get('formRules.srcIdRequired') }]}>
                <Select>
                  {headers.map(i => (
                    <Option value={i} key={i}>
                      {i}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Dst ID" name="dstId" rules={[{ required: true, message: intl.get('formRules.dstIdRequired') }]}>
                <Select>
                  {headers.map(i => (
                    <Option value={i} key={i}>
                      {i}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Rank" name="rank">
                <Select allowClear={true}>
                  {headers.map(i => (
                    <Option value={i} key={i}>
                      {i}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>;
          }}
        </Form.Item>
        <Form.Item noStyle>
          <Button
            htmlType="submit"
            type="primary"
          >
            {intl.get('common.import')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default observer(ExportModal);
