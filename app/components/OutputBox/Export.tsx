import { Button, Form, Input, Radio, Select } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { FormInstance } from 'antd/es/form';
import { IDispatch } from '#app/store';
import { trackEvent } from '#app/utils/stat';
import './Export.less';

const Option = Select.Option;
interface IProps
  extends ReturnType<typeof mapDispatch>,
  RouteComponentProps {
  data: any;
}

const mapState = () => ({});

const mapDispatch = (dispatch: IDispatch) => ({
  updatePreloadData: data =>
    dispatch.explore.update({
      preloadData: data,
    }),
});

class Export extends React.Component<IProps> {
  formRef = React.createRef<FormInstance>()
  handleExport = () => {
    const { getFieldsValue } = this.formRef.current!;
    const { type, vertexId, srcId, dstId, edgeType, rank } = getFieldsValue();
    const { tables } = this.props.data;
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
    this.props.updatePreloadData({
      vertexes,
      edges,
    });
    this.props.history.push('/explore');
    trackEvent('navigation', 'view_explore', 'from_console_btn');
  };

  render() {
    const { headers } = this.props.data;
    const { getFieldsValue } = this.formRef.current!;
    const {
      type = 'vertex',
      vertexId,
      srcId,
      dstId,
      edgeType,
    } = getFieldsValue();
    const disabled =
      (type === 'vertex' && !vertexId) ||
      (type === 'edge' && (!srcId || !dstId || !edgeType));
    const layout = {
      labelCol: { span: 10 },
      wrapperCol: { span: 8 },
    };
    return (
      <div className="export-modal">
        <Form className="form" {...layout} ref={this.formRef} initialValues={{
          type: 'vertex',

        }}>
          <Form.Item name="type">
            <Radio.Group>
              <Radio.Button value="vertex">
                {intl.get('import.vertexText')}
              </Radio.Button>
              <Radio.Button value="edge">
                {intl.get('common.edge')}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          {type === 'vertex' && (
            <>
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
            </>
          )}
          {type === 'edge' && (
            <>
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
            </>
          )}
        </Form>
        <div className="modal-footer">
          <Button
            disabled={!!disabled}
            key="confirm"
            type="primary"
            onClick={this.handleExport}
          >
            {intl.get('common.import')}
          </Button>
        </div>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(withRouter(Export));
