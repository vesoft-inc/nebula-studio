import { Breadcrumb, Button, Popconfirm, Table, message } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { Link, RouteComponentProps, match, withRouter } from 'react-router-dom';
import { DeleteTwoTone, FormOutlined, PlusOutlined } from '@ant-design/icons';

import Search from '../Search';
import { IDispatch, IRootState } from '#app/store';
import { sortByFieldAndFilter } from '#app/utils/function';
import { trackPageView } from '#app/utils/stat';

import './index.less';

const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncGetTagList,
  tagList: state.nebula.tagList,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetTagList: dispatch.nebula.asyncGetTagList,
  asyncDeleteTag: dispatch.nebula.asyncDeleteTag,
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch>,
  RouteComponentProps {
  match: match<{ space: string }>;
}

interface ITag {
  name: string;
  fields: IField[];
}

interface IField {
  Field: string;
  Type: string;
}

interface IState {
  expandedRowKeys: number[];
  searchVal: string;
}

function renderTagInfo(tag: ITag) {
  const fieldsColumn = [
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
        {tag.name} {intl.get('common.relatedProperties')}:
      </p>
      <Table
        columns={fieldsColumn}
        dataSource={tag.fields}
        rowKey="Field"
        pagination={false}
      />
    </div>
  );
}
class TagList extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      expandedRowKeys: [],
      searchVal: '',
    };
  }

  componentDidMount() {
    trackPageView('/space/config/tag/list');
    this.props.asyncGetTagList();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.space !== this.props.match.params.space) {
      this.props.asyncGetTagList();
    }
  }

  handleDeleteTag = async name => {
    const res = await this.props.asyncDeleteTag(name);
    if (res.code === 0) {
      message.success(intl.get('common.deleteSuccess'));
      await this.props.asyncGetTagList();
    } else {
      message.warning(res.message);
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

  renderTagList = () => {
    const { loading, tagList } = this.props;
    const { match } = this.props;
    const {
      params: { space },
    } = match;
    const tagColumns = [
      {
        title: intl.get('common.name'),
        dataIndex: 'name',
        width: '50%',
        align: 'center' as const,
      },
      {
        title: intl.get('common.operation'),
        dataIndex: 'operation',
        align: 'center' as const,
        width: '45%',
        render: (_1, tag) => {
          if (tag.name) {
            return (
              <div className="operation">
                <div>
                  <Button shape="circle">
                    <Link
                      to={`/space/${space}/tag/edit/${tag.name}`}
                      data-track-category="navigation"
                      data-track-action="view_tag_edit"
                      data-track-label="from_tag_list"
                    >
                      <FormOutlined className="edit-btn" />
                    </Link>
                  </Button>
                  <Popconfirm
                    onConfirm={() => {
                      this.handleDeleteTag(tag.name);
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
    const { expandedRowKeys, searchVal } = this.state;
    const data = sortByFieldAndFilter({
      field: 'name',
      searchVal,
      list: tagList,
    });
    return (
      <Table
        className="expanded-table"
        dataSource={data}
        columns={tagColumns}
        expandedRowRender={renderTagInfo}
        onRow={record => {
          return {
            onClick: () => {
              this.handleRowClick(record);
            },
          };
        }}
        expandedRowKeys={expandedRowKeys}
        loading={!!loading}
        rowKey="name"
      />
    );
  };
  render() {
    const { match } = this.props;
    const {
      params: { space },
    } = match;
    return (
      <div className="nebula-tag">
        <header>
          <Breadcrumb className="breadcrumb-bold">
            <Breadcrumb.Item>{intl.get('common.tag')}</Breadcrumb.Item>
            <Breadcrumb.Item>{intl.get('common.list')}</Breadcrumb.Item>
          </Breadcrumb>
        </header>
        <div className="btns">
          <Button type="primary">
            <Link
              to={`/space/${space}/tag/create`}
              data-track-category="navigation"
              data-track-action="view_tag_create"
              data-track-label="from_tag_list"
            >
              <PlusOutlined />
              {intl.get('common.create')}
            </Link>
          </Button>
          <Search onSearch={this.handleSearch} />
        </div>
        {this.renderTagList()}
      </div>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(TagList));
