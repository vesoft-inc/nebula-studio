import { Breadcrumb, Button, Icon, message, Popconfirm, Table } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { Link, match, RouteComponentProps, withRouter } from 'react-router-dom';

import { IDispatch, IRootState } from '#assets/store';
import { trackEvent, trackPageView } from '#assets/utils/stat';

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
  id: string;
  name: string;
  fields: IField[];
}

interface IField {
  Field: string;
  Type: string;
}

interface IState {
  expandedRowKeys: number[];
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
    trackEvent(
      'schema',
      'delete_tag',
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
                      onClick={() =>
                        trackEvent(
                          'navigation',
                          'view_tag_edit',
                          'from_tag_list',
                        )
                      }
                    >
                      <Icon type="form" className="edit-btn" />
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
    const { expandedRowKeys } = this.state;
    return (
      <Table
        className="expanded-table"
        dataSource={tagList}
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
        rowKey="id"
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
              onClick={() =>
                trackEvent('navigation', 'view_tag_create', 'from_tag_list')
              }
            >
              <Icon type="plus" />
              {intl.get('common.create')}
            </Link>
          </Button>
        </div>
        {this.renderTagList()}
      </div>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(TagList));
