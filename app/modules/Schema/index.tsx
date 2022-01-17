import { Button, Divider, Icon, message, Popconfirm, Table } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';

import { Instruction } from '#app/components';
import { IDispatch, IRootState } from '#app/store';
import { trackPageView } from '#app/utils/stat';

import './index.less';

const mapState = (state: IRootState) => ({
  loading:
    !!state.loading.effects.nebula.asyncGetSpacesList ||
    !!state.loading.effects.nebula.asyncSwitchSpace,
  spaceList: state.nebula.spaceList,
  currentSpace: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpacesList: dispatch.nebula.asyncGetSpacesList,
  asyncDeleteSpace: dispatch.nebula.asyncDeleteSpace,
  asyncSwitchSpace: dispatch.nebula.asyncSwitchSpace,
  asyncClearExplore: dispatch.explore.clear,
  clearCurrentSpace: () =>
    dispatch.nebula.update({
      currentSpace: '',
    }),
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    RouteComponentProps {}

class Schema extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  componentDidMount() {
    trackPageView('/schema');
    this.getSpaces();
  }

  getSpaces = () => {
    this.props.asyncGetSpacesList();
  };

  handleDeleteSpace = async (name: string) => {
    const res = await this.props.asyncDeleteSpace(name);
    if (res.code === 0) {
      const { currentSpace } = this.props;
      message.success(intl.get('common.deleteSuccess'));
      await this.getSpaces();
      if (currentSpace === name) {
        this.props.clearCurrentSpace();
      }
    }
  };

  handleSwitchSpace = async (space: string) => {
    const { asyncSwitchSpace, history, asyncClearExplore } = this.props;
    const err = await asyncSwitchSpace(space);
    if (!err) {
      await asyncClearExplore();
      history.push(`/space/${space}/tag/list`);
    } else if (err && err.toLowerCase().includes('spacenotfound')) {
      message.warning(intl.get('schema.useSpaceErrTip'));
    }
  };
  render() {
    const { loading, spaceList } = this.props;
    const columns = [
      {
        title: intl.get('common.serialNumber'),
        dataIndex: 'serialNumber',
        align: 'center' as const, // hack: typescript does not recognize attributes
      },
      {
        title: intl.get('common.name'),
        dataIndex: 'Name',
        align: 'center' as const,
        render: value => (
          <Button
            type="link"
            onClick={() => this.handleSwitchSpace(value)}
            data-track-category="navigation"
            data-track-action="view_space_list"
            data-track-label="from_space_list"
          >
            {value}
          </Button>
        ),
      },
      {
        title: (
          <>
            <span>Partition Number</span>
            <Instruction
              description={intl.get('schema.partitionNumDescription')}
            />
          </>
        ),
        dataIndex: 'Partition Number',
        align: 'center' as const,
      },
      {
        title: (
          <>
            <span>Replica Factor</span>
            <Instruction
              description={intl.get('schema.replicaFactorDescription')}
            />
          </>
        ),
        dataIndex: 'Replica Factor',
        align: 'center' as const,
      },
      {
        title: (
          <>
            <span>Charset</span>
            <Instruction description={intl.get('schema.charsetDescription')} />
          </>
        ),
        dataIndex: 'Charset',
        align: 'center' as const,
      },
      {
        title: (
          <>
            <span>Collate</span>
            <Instruction description={intl.get('schema.collateDescription')} />
          </>
        ),
        dataIndex: 'Collate',
        align: 'center' as const,
      },
      {
        title: (
          <>
            <span>Vid Type</span>
            <Instruction description={intl.get('schema.vidTypeDescription')} />
          </>
        ),
        dataIndex: 'Vid Type',
        align: 'center' as const,
      },
      {
        title: 'Atomic Edge',
        dataIndex: 'Atomic Edge',
        align: 'center' as const,
        render: value => String(value),
      },
      {
        title: 'Group',
        dataIndex: 'Group',
        align: 'center' as const,
      },
      {
        title: 'Comment',
        dataIndex: 'Comment',
        align: 'center' as const,
      },
      {
        title: intl.get('common.operation'),
        dataIndex: 'operation',
        align: 'center' as const,
        render: (_1, space) => {
          if (space.ID) {
            return (
              <div className="operation">
                <div>
                  <Button
                    shape="circle"
                    onClick={() => this.handleSwitchSpace(space.Name)}
                    data-track-category="navigation"
                    data-track-action="view_space_list"
                    data-track-label="from_space_list"
                  >
                    <Icon type="tool" theme="twoTone" />
                  </Button>
                  <Popconfirm
                    onConfirm={() => this.handleDeleteSpace(space.Name)}
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
      <div className="nebula-schema padding-page">
        <div className="header">
          <span className="header-title">{intl.get('schema.spaceList')}</span>
        </div>
        <Divider />
        <div className="btns">
          <Button type="primary">
            <Link
              to="/space/create"
              data-track-category="navigation"
              data-track-action="view_space_create"
              data-track-label="from_space_list"
            >
              <Icon type="plus" />
              {intl.get('common.create')}
            </Link>
          </Button>
        </div>
        <Table
          bordered={true}
          dataSource={spaceList}
          columns={columns}
          loading={!!loading}
          rowKey="ID"
        />
      </div>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(Schema));
