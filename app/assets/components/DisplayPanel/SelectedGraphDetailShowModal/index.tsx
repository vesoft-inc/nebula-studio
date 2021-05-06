import { Button, Input, message, Table, Tabs, Tooltip } from 'antd';
import JSONBigint from 'json-bigint';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';

import { Instruction, Modal } from '#assets/components';
import { downloadCSVFiles, parseData } from '#assets/config/explore';
import { INode, IPath } from '#assets/utils/interface';

import './index.less';
const TabPane = Tabs.TabPane;

interface IProps {
  vertexes: INode[];
  edges: IPath[];
  showType?: 'vertex' | 'edge';
  handlerRef?: (handler) => void;
}

interface IState {
  tagType: string;
  _vertexes: any;
  _edges: any;
  originVertexes: any;
  originEdges: any;
  searchValue: string;
}
class SelectedGraphDetailShowModal extends React.PureComponent<IProps, IState> {
  modalHandler;
  constructor(props: IProps) {
    super(props);
    this.state = {
      tagType: 'vertex',
      _vertexes: [],
      _edges: [],
      originVertexes: [],
      originEdges: [],
      searchValue: '',
    };
  }

  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        show: this.handleOpenModal,
      });
    }
  }

  handleOpenModal = async type => {
    if (this.modalHandler) {
      this.handleChangeType(type);
      this.modalHandler.show();
    }
  };

  handleChangeType = async (key: string) => {
    const { vertexes, edges } = this.props;
    this.setState({
      tagType: key,
      _vertexes: parseData(vertexes, 'vertex').tables,
      originVertexes: parseData(vertexes, 'vertex').tables,
      _edges: parseData(edges, 'edge').tables,
      originEdges: parseData(edges, 'edge').tables,
      searchValue: '',
    });
  };

  handleExportToCSV = () => {
    const { tagType, _vertexes, _edges } = this.state;
    const data = tagType === 'vertex' ? _vertexes : _edges;
    const headers = Object.keys(data[0]);
    downloadCSVFiles({ headers, tables: data, title: tagType });
  };

  handleUpdateValue = e => {
    this.setState({ searchValue: e.target.value });
  };
  handleSearch = value => {
    const { tagType, originVertexes, originEdges } = this.state;
    if (value) {
      const data = tagType === 'vertex' ? originVertexes : originEdges;
      const reg = /([a-zA-Z0-9_.]*)\s*([\=\>\<\!]+)\s*(.*)/g;
      const searchInfo = reg.exec(value) || [];
      if (searchInfo.length > 0) {
        const key = searchInfo[1];
        const compare = searchInfo[2];
        const result = searchInfo[3];
        const filters = data.filter(item => {
          const { attributes, ...rest } = item;
          const flattenData = { ...rest, ...JSON.parse(attributes) };
          let checked = false;
          if (flattenData[key]) {
            const value = flattenData[key].toString();
            const strReg = /^['|"].*['|"]$/;
            switch (compare) {
              case '=':
                if (strReg.test(result)) {
                  checked = value === result.slice(1, result.length - 1);
                } else {
                  checked = value === result;
                }
                break;
              case '>':
                checked = value > result;
                break;
              case '<':
                checked = value < result;
                break;
              case '<=':
                checked = value <= result;
                break;
              case '>=':
                checked = value >= result;
                break;
              case '<>':
              case '!=':
                if (strReg.test(result)) {
                  checked = value !== result.slice(1, result.length - 1);
                } else {
                  checked = value !== result;
                }
                break;
              default:
                break;
            }
          }
          return checked;
        });
        if (tagType === 'vertex') {
          this.setState({ _vertexes: filters });
        } else {
          this.setState({ _edges: filters });
        }
      } else {
        return message.warning(intl.get('explore.expressionError'));
      }
    } else {
      if (tagType === 'vertex') {
        this.setState({
          _vertexes: originVertexes,
        });
      } else {
        this.setState({
          _edges: originEdges,
        });
      }
    }
  };

  render() {
    const { tagType, _vertexes, _edges, searchValue } = this.state;
    const data = tagType === 'vertex' ? _vertexes : _edges;
    const columns =
      tagType === 'vertex'
        ? [
            {
              title: 'vid',
              dataIndex: 'vid',
              align: 'center' as const,
            },
            {
              title: 'attributes',
              dataIndex: 'attributes',
              ellipsis: true,
              align: 'center' as const,
              render: record => {
                return (
                  <Tooltip
                    placement="topLeft"
                    title={
                      <pre>
                        {JSONBigint.stringify(
                          JSONBigint.parse(record),
                          (_, value) => {
                            if (typeof value === 'string') {
                              return value.replace(/\u0000+$/, '');
                            }
                            return value;
                          },
                          2,
                        )}
                      </pre>
                    }
                  >
                    {record}
                  </Tooltip>
                );
              },
            },
          ]
        : [
            {
              title: 'type',
              dataIndex: 'type',
              align: 'center' as const,
            },
            {
              title: 'rank',
              dataIndex: 'rank',
              align: 'center' as const,
            },
            {
              title: 'srcId',
              dataIndex: 'srcId',
              align: 'center' as const,
            },
            {
              title: 'dstId',
              dataIndex: 'dstId',
              align: 'center' as const,
            },
            {
              title: 'attributes',
              dataIndex: 'attributes',
              ellipsis: true,
              align: 'center' as const,
              render: record => {
                return (
                  <Tooltip
                    placement="topLeft"
                    title={
                      <pre>
                        {JSONBigint.stringify(
                          JSONBigint.parse(record),
                          null,
                          2,
                        )}
                      </pre>
                    }
                  >
                    {record}
                  </Tooltip>
                );
              },
            },
          ];
    return (
      <Modal
        className="modal-show-selected"
        width="70%"
        handlerRef={handler => (this.modalHandler = handler)}
        title={
          <Tabs onChange={this.handleChangeType} defaultActiveKey={tagType}>
            <TabPane tab={intl.get('explore.selectedVertexes')} key="vertex" />
            <TabPane tab={intl.get('explore.selectedEdges')} key="edge" />
          </Tabs>
        }
        footer={null}
      >
        <div className="operation">
          <span>
            {intl.get('common.total')}: {data.length}
          </span>
          <div className="btns">
            <Button
              type="primary"
              data-track-category="explore"
              data-track-action="export_csv"
              data-track-label="from_info_modal"
              onClick={this.handleExportToCSV}
            >
              {intl.get('explore.exportToCSV')}
            </Button>
            <Input.Search
              placeholder="person.name > xx"
              value={searchValue}
              onChange={this.handleUpdateValue}
              onSearch={this.handleSearch}
            />
            <Instruction description={intl.get('explore.searchTip')} />
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(_, index) => index.toString()}
        />
      </Modal>
    );
  }
}
export default SelectedGraphDetailShowModal;
