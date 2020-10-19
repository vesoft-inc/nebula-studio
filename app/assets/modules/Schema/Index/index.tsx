import {
  Breadcrumb,
  Button,
  Icon,
  message,
  Popconfirm,
  Select,
  Table,
} from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { Link, match, RouteComponentProps, withRouter } from 'react-router-dom';

import { IDispatch, IRootState } from '#assets/store';
import { trackEvent, trackPageView } from '#assets/utils/stat';

import './index.less';
const { Option } = Select;

const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncGetIndexList,
  indexList: state.nebula.indexList,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetIndexList: dispatch.nebula.asyncGetIndexList,
  asyncDeleteIndex: dispatch.nebula.asyncDeleteIndex,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    RouteComponentProps {
  match: match<{ space: string }>;
}

interface IState {
  indexType: IndexType;
  expandedRowKeys: number[];
}

type IndexType = 'TAG' | 'EDGE';

interface IIndexList {
  id: string;
  name: string;
  fields: IField[];
}

interface IField {
  Field: string;
  Type: string;
}

function renderIndexInfo(index: IIndexList) {
  const fieldsColumns = [
    {
      title: intl.get('common.propertyName'),
      dataIndex: 'Field',
      align: 'center' as const,
    },
    {
      title: intl.get('common.dataType'),
      dataIndex: 'Type',
      align: 'center' as const,
    },
  ];
  return (
    <div>
      <p className="table-inner-title">
        {index.name} {intl.get('common.relatedProperties')}:
      </p>
      <Table
        columns={fieldsColumns}
        dataSource={index.fields}
        rowKey="Field"
        pagination={false}
      />
    </div>
  );
}
class IndexList extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      indexType: 'TAG',
      expandedRowKeys: [],
    };
  }

  componentDidMount() {
    trackPageView('/space/config/index/list');
    this.props.asyncGetIndexList('TAG');
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.space !== this.props.match.params.space) {
      const { indexType } = this.state;
      this.props.asyncGetIndexList(indexType);
    }
  }

  handleChangeType = value => {
    const self = this;
    this.setState({ indexType: value }, () => {
      self.props.asyncGetIndexList(value);
    });
  };

  handleDeleteIndex = async (type, name) => {
    const res = await this.props.asyncDeleteIndex({
      type,
      name,
    });
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      await this.props.asyncGetIndexList(type);
    }
    trackEvent(
      'schema',
      'delete_index',
      res.code === 0 ? 'ajax_success' : 'ajax_fail',
    );
  };

  handleRowClick = async record => {
    const { id: key } = record;
    const { expandedRowKeys } = this.state;
    this.setState({
      expandedRowKeys: expandedRowKeys.includes(key) ? [] : [key],
    });
  };

  renderIndexList = () => {
    const { loading, indexList } = this.props;
    const { indexType, expandedRowKeys } = this.state;

    const indexColumns = [
      {
        title: intl.get('common.name'),
        dataIndex: 'name',
        align: 'center' as const,
      },
      {
        title:
          indexType === 'TAG'
            ? intl.get('common.tag')
            : intl.get('common.edge'),
        dataIndex: 'owner',
        align: 'center' as const,
      },
      {
        title: intl.get('common.operation'),
        dataIndex: 'operation',
        align: 'center' as const,
        render: (_1, index) => {
          if (index.name) {
            return (
              <div className="operation">
                <div>
                  <Popconfirm
                    onConfirm={() => {
                      this.handleDeleteIndex(indexType, index.name);
                    }}
                    title={intl.get('common.ask')}
                    okText={intl.get('common.ok')}
                    cancelText={intl.get('common.cancel')}
                  >
                    <Button shape="circle">
                      <Icon
                        type="delete"
                        theme="twoTone"
                        twoToneColor="#CF1322"
                      />
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            );
          }
        },
      },
    ];
    return (
      <Table
        className="expanded-table"
        dataSource={indexList}
        columns={indexColumns}
        expandedRowRender={renderIndexInfo}
        expandedRowKeys={expandedRowKeys}
        onRow={record => {
          return {
            onClick: () => {
              this.handleRowClick(record);
            },
          };
        }}
        loading={!!loading}
        rowKey="id"
      />
    );
  };

  render() {
    const { indexType } = this.state;
    const { match, history } = this.props;
    const {
      params: { space },
    } = match;
    const {
      location: { state },
    }: any = history;
    const type = state && state.indexType ? state.indexType : indexType;
    return (
      <div className="nebula-index">
        <header>
          <Breadcrumb className="breadcrumb-bold">
            <Breadcrumb.Item>{intl.get('common.index')}</Breadcrumb.Item>
            <Breadcrumb.Item>{intl.get('common.list')}</Breadcrumb.Item>
          </Breadcrumb>
        </header>
        <div className="btns">
          <Button type="primary">
            <Link
              to={`/space/${space}/index/create`}
              onClick={() =>
                trackEvent('navigation', 'view_index_create', 'from_index_list')
              }
            >
              <Icon type="plus" />
              {intl.get('common.create')}
            </Link>
          </Button>
          <Select value={type} onChange={this.handleChangeType}>
            <Option value="TAG">Tag</Option>
            <Option value="EDGE">Edge Type</Option>
          </Select>
        </div>
        {this.renderIndexList()}
      </div>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(IndexList));
