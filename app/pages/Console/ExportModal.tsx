import { Button, Form, Input, Modal, Radio, Select } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';

import './index.less';
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
      className="export-node-modal"
      footer={null}
      width="650px"
      visible={visible}
      onCancel={onClose}
    >
      <Form {...layout} onFinish={handleExport} initialValues={{
        type: 'vertex'
      }}>
        <Form.Item name="type" className="select-type">
          <Radio.Group className="nebula-tab-group" buttonStyle="solid">
            <Radio.Button value="vertex">
              {intl.get('import.vertexText')}
            </Radio.Button>
            <Radio.Button value="edge">
              {intl.get('common.edge')}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle={true} dependencies={['type']}>
          {({ getFieldValue }) => {
            const type = getFieldValue('type');
            return type === 'vertex' ? <>
              <p>{intl.get('console.exportVertex')}</p>
              <Form.Item className="select-component" label="vid" name="vertexId" rules={[{ required: true }]}>
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
              <Form.Item className="select-component" label="Edge Type" name="edgeType" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item className="select-component" label="Src ID" name="srcId" rules={[{ required: true }]}>
                <Select>
                  {headers.map(i => (
                    <Option value={i} key={i}>
                      {i}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item className="select-component" label="Dst ID" name="dstId" rules={[{ required: true }]}>
                <Select>
                  {headers.map(i => (
                    <Option value={i} key={i}>
                      {i}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item className="select-component" label="Rank" name="rank">
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
        <Form.Item noStyle={true}>
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
