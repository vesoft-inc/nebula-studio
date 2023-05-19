import { Button, Form, Modal, Radio, Select } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
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
  data: {
    space: string;
    spaceVidType: string;
    [key: string]: any;
  };
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
  const { schema: { switchSpace, getEdges } } = useStore();
  const { headers, tables, space } = data;
  const { intl } = useI18n();
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const isExist = useCallback((value) => value !== null && value !== undefined && value !== '', []);
  useEffect(() => {
    init();
  }, [space]);

  const init = async () => {
    setLoading(true);
    await switchSpace(space);
    const _edges = await getEdges();
    setEdges(_edges);
    setLoading(false);
  };
  const handleExport = async (values) => {
    const { type, vertexIds, srcId, dstId, edgeType, rank } = values;
    const vertexes =
      type === 'vertex'
        ? tables.reduce((acc, cur) => {
          if (cur.type === 'vertex') {
            isExist(cur.vid) && acc.push(cur.vid);
          } else {
            vertexIds.forEach(id => {
              isExist(cur[id]) && acc.push(cur[id].toString());
            });
          }
          return acc;
        }, [])
        : tables.reduce((acc, cur) => {
          isExist(cur[srcId]) && acc.push(cur[srcId]);
          isExist(cur[dstId]) && acc.push(cur[dstId]);
          return acc;
        }, []);
    const edges =
      type === 'edge'
        ? tables.reduce((acc, cur) => {
          const _srcId = cur[srcId];
          const _dstId = cur[dstId];
          const regex = /^(column|edge)-(.*)/gm;
          const [, type, value] = regex.exec(edgeType) || [];
          const _edgeType = type === 'edge' ? value : cur[value];
          if(isExist(_srcId) && isExist(_dstId)) {
            acc.push({
              srcId: _srcId,
              dstId: _dstId,
              rank: isExist(rank) ? cur[rank] : 0,
              edgeType: _edgeType,
            });
          }
          return acc;
        }, [])
        : [];
    setImportLoading(true);
    await onExplorer({
      space,
      vertexes, 
      edges
    });
    setImportLoading(false);
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
              <Form.Item label="vid" name="vertexIds" rules={[{ required: true, message: intl.get('formRules.vidRequired') }]}>
                <Select mode="multiple" allowClear>
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
                <Select loading={loading} popupClassName={styles.edgeSelect} optionLabelProp="label">
                  {headers.map(i => (
                    <Option value={`column-${i}`} key={`column-${i}`} label={i}>
                      <span className={styles.edgeItem} aria-label={i}>
                        <span className={styles.value}>{i}</span>
                        <span className={styles.type}>{intl.get('common.columnName')}</span>
                      </span>
                    </Option>
                  ))}
                  {edges.map(i => (
                    <Option value={`edge-${i}`} key={`edge-${i}`} label={i}>
                      <span className={styles.edgeItem} aria-label={i}>
                        <span className={styles.value}>{i}</span>
                        <span className={styles.type}>{intl.get('common.edge')}</span>
                      </span>
                    </Option>
                  ))}
                </Select>
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
            loading={importLoading}
          >
            {intl.get('common.import')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default observer(ExportModal);
