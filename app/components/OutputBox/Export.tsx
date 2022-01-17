import { Button, Form, Input, Radio, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form/Form';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { IDispatch } from '#app/store';
import { trackEvent } from '#app/utils/stat';

import './Export.less';

const Option = Select.Option;
interface IProps
  extends ReturnType<typeof mapDispatch>,
    FormComponentProps,
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
  handleExport = () => {
    const { getFieldsValue } = this.props.form;
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
    const { getFieldDecorator, getFieldsValue } = this.props.form;
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
        <Form className="form" {...layout}>
          {getFieldDecorator('type', {
            initialValue: 'vertex',
          })(
            <Radio.Group>
              <Radio.Button value="vertex">
                {intl.get('import.vertexText')}
              </Radio.Button>
              <Radio.Button value="edge">
                {intl.get('common.edge')}
              </Radio.Button>
            </Radio.Group>,
          )}
          {type === 'vertex' && (
            <>
              <p>{intl.get('console.exportVertex')}</p>
              <Form.Item className="select-component" label="vid">
                {getFieldDecorator('vertexId', {
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(
                  <Select>
                    {headers.map(i => (
                      <Option value={i} key={i}>
                        {i}
                      </Option>
                    ))}
                  </Select>,
                )}
              </Form.Item>
            </>
          )}
          {type === 'edge' && (
            <>
              <p>{intl.get('console.exportEdge')}</p>
              <Form.Item className="select-component" label="Edge Type">
                {getFieldDecorator('edgeType', {
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(<Input />)}
              </Form.Item>
              <Form.Item className="select-component" label="Src ID">
                {getFieldDecorator('srcId', {
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(
                  <Select>
                    {headers.map(i => (
                      <Option value={i} key={i}>
                        {i}
                      </Option>
                    ))}
                  </Select>,
                )}
              </Form.Item>
              <Form.Item className="select-component" label="Dst ID">
                {getFieldDecorator('dstId', {
                  rules: [
                    {
                      required: true,
                    },
                  ],
                })(
                  <Select>
                    {headers.map(i => (
                      <Option value={i} key={i}>
                        {i}
                      </Option>
                    ))}
                  </Select>,
                )}
              </Form.Item>
              <Form.Item className="select-component" label="Rank">
                {getFieldDecorator('rank')(
                  <Select allowClear={true}>
                    {headers.map(i => (
                      <Option value={i} key={i}>
                        {i}
                      </Option>
                    ))}
                  </Select>,
                )}
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
)(withRouter(Form.create<IProps>()(Export)));
