import { Button, Divider, Icon, message, Popconfirm, Table } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { Instruction } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';
import { trackEvent, trackPageView } from '#assets/utils/stat';

import './index.less';

const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncGetSpacesList,
  spaceList: state.nebula.spaceList,
  currentSpace: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpacesList: dispatch.nebula.asyncGetSpacesList,
  asyncDeleteSpace: dispatch.nebula.asyncDeleteSpace,
  asyncSwitchSpace: dispatch.nebula.asyncSwitchSpace,
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
    trackEvent(
      'schema',
      'delete_space',
      res.code === 0 ? 'ajax_success' : 'ajax_fail',
    );
  };

  handleCreateSpace = () => {
    this.props.history.push({
      pathname: '/space/create',
    });
    trackEvent('navigation', 'view_space_create', 'from_space_list');
  };

  handleConfigSpace = async (space: string) => {
    await this.props.asyncSwitchSpace(space);
    this.props.history.push(`/space/${space}/tag/list`);
    trackEvent('navigation', 'view_space_list', 'from_space_list');
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
          <Button type="link" onClick={() => this.handleConfigSpace(value)}>
            {value}
          </Button>
        ),
      },
      {
        title: (
          <>
            <span>partition_num</span>
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
            <span>replica_factor</span>
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
            <span>charset</span>
            <Instruction description={intl.get('schema.charsetDescription')} />
          </>
        ),
        dataIndex: 'Charset',
        align: 'center' as const,
      },
      {
        title: (
          <>
            <span>collate</span>
            <Instruction description={intl.get('schema.collateDescription')} />
          </>
        ),
        dataIndex: 'Collate',
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
                    onClick={() => this.handleConfigSpace(space.Name)}
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
      <div className="nebula-schema">
        <div className="header">
          <span className="header-title">{intl.get('schema.spaceList')}</span>
        </div>
        <Divider />
        <div className="btns">
          <Button type="primary" onClick={this.handleCreateSpace}>
            <Icon type="plus" />
            {intl.get('common.create')}
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
