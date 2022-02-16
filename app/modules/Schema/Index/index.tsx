import {
  Breadcrumb,
  Button,
  Popconfirm,
  Select,
  Table,
  message,
} from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';

import Search from '../Search';
import { IDispatch, IRootState } from '#app/store';
import { sortByFieldAndFilter } from '#app/utils/function';
import { trackPageView } from '#app/utils/stat';

import './index.less';
const { Option } = Select;

const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncGetIndexList,
  indexList: state.nebula.indexList,
  currentSpace: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetIndexList: dispatch.nebula.asyncGetIndexList,
  asyncDeleteIndex: dispatch.nebula.asyncDeleteIndex,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    RouteComponentProps {}

interface IState {
  indexType: IndexType;
  expandedRowKeys: number[];
  searchVal: string;
}

type IndexType = 'TAG' | 'EDGE';

interface IIndexList {
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
      searchVal: '',
    };
  }

  componentDidMount() {
    trackPageView('/space/config/index/list');
    const { indexType } = this.state;
    const { history } = this.props;
    const {
      location: { state },
    }: any = history;
    const type = state && state.indexType ? state.indexType : indexType;
    this.props.asyncGetIndexList(type);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.currentSpace &&
      prevProps.currentSpace !== this.props.currentSpace
    ) {
      const { indexType } = this.state;
      this.props.asyncGetIndexList(indexType);
    }
  }

  handleChangeType = value => {
    const self = this;
    this.setState({ indexType: value }, () => {
      self.props.history.replace({
        pathname: '/space/index/list',
        state: { indexType: value },
      });
      self.props.asyncGetIndexList(value);
    });
  };

  handleDeleteIndex = async(type, name) => {
    const res = await this.props.asyncDeleteIndex({
      type,
      name,
    });
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      await this.props.asyncGetIndexList(type);
    }
  };

  handleRowClick = async record => {
    const { name: key } = record;
    const { expandedRowKeys } = this.state;
    this.setState({
      expandedRowKeys: expandedRowKeys.includes(key) ? [] : [key],
    });
  };

  handleSearch = value => {
    this.setState({
      searchVal: value,
    });
  };

  renderIndexList = () => {
    const { loading, indexList } = this.props;
    const { indexType, expandedRowKeys, searchVal } = this.state;
    const data = sortByFieldAndFilter({
      field: 'name',
      searchVal,
      list: indexList,
    });
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
        title: intl.get('common.comment'),
        dataIndex: 'comment',
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
                      <DeleteTwoTone
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
        dataSource={data}
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
        rowKey="name"
      />
    );
  };

  render() {
    const { indexType } = this.state;
    const { history } = this.props;
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
              to={`/space/index/create`}
              data-track-category="navigation"
              data-track-action="view_index_create"
              data-track-label="from_index_list"
            >
              <PlusOutlined />
              {intl.get('common.create')}
            </Link>
          </Button>
          <Select value={type} onChange={this.handleChangeType}>
            <Option value="TAG">Tag</Option>
            <Option value="EDGE">Edge Type</Option>
          </Select>
          <Search onSearch={this.handleSearch} />
        </div>
        {this.renderIndexList()}
      </div>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(IndexList));
