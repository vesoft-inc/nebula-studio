import { Button } from 'antd';
import * as d3 from 'd3';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal, NebulaD3 } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';
import { IEdge, INode } from '#assets/store/models';

import './index.less';
import Panel from './Pannel';
import Setting from './Setting';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
  selectVertexes: state.explore.selectVertexes,
  actionData: state.explore.actionData,
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
  space: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSelectIds: (vertexes: INode[]) => {
    dispatch.explore.update({
      selectVertexes: vertexes,
    });
  },
  updateActionData: (actionData, edges, vertexes) => {
    dispatch.explore.update({
      actionData,
      edges,
      vertexes,
      selectVertexes: [],
    });
  },
  asyncGetTagsName: dispatch.nebula.asyncGetTagsName,
});

interface IState {
  width: number;
  height: number;
  checkedList: string[];
}

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

class NebulaGraph extends React.Component<IProps, IState> {
  settingHandler;
  $tooltip;
  ref: HTMLDivElement;

  constructor(props: IProps) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      checkedList: [],
    };
  }

  handleSelectVertexes = (nodes: any[]) => {
    this.props.updateSelectIds(nodes);
  };

  componentDidMount() {
    // render tootlip into dom
    const { clientWidth, clientHeight } = this.ref;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });

    this.$tooltip = d3
      .select(this.ref)
      .append('div')
      .attr('class', 'tooltip')
      .style('max-height', clientHeight)
      .style('overflow', 'auto');

    window.addEventListener('resize', this.handleResize);

    this.$tooltip.on('mouseout', this.handleMouseOutNode);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  toolTipX = (x: number) => {
    if (x > this.ref.clientWidth / 2) {
      // the left to show
      return x - 230;
    } else {
      // the right to show
      return x + 30;
    }
  };

  toolTipY = (x: number, node: any) => {
    const { clientHeight } = this.ref;
    // const height = this.$tooltip.node().getBoundingClientRect().height , This can cause bugs
    const height = node.nodeProp.headers.length * 31 + 31;
    if (x + height > clientHeight) {
      return clientHeight - height;
    } else {
      return x;
    }
  };

  handleMouseInNode = node => {
    const e: any = event || window.event;
    const nodeProp = node.nodeProp
      ? node.nodeProp.tables
          .map(v => {
            return Object.keys(v)
              .map(index => {
                return `<p key=${index}>${index}: ${v[index]}</p>`;
              })
              .join('');
          })
          .join('')
      : '';
    this.$tooltip
      .transition()
      .duration(200)
      .style('display', 'block')
      .style('opacity', '0.85')
      .style('top', this.toolTipY(e.offsetY, node) + 'px')
      .style('left', this.toolTipX(e.offsetX) + 'px');

    this.$tooltip.html(`<p>id: ${node.name}</p> ${nodeProp}`);
  };

  handleMouseOutNode = () => {
    this.$tooltip.style('display', 'none');
  };

  handleResize = () => {
    const { clientWidth, clientHeight } = this.ref;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });
  };

  handleUndo = () => {
    const { actionData, vertexes, edges } = this.props;
    const data = actionData.pop() as any;
    this.props.updateActionData(
      actionData,
      _.differenceBy(edges, data.edges, (e: IEdge) => e.id),
      _.differenceBy(vertexes, data.vertexes, (v: INode) => v.name),
    );
  };

  handleSetting = async () => {
    const { username, host, password, space, asyncGetTagsName } = this.props;
    await asyncGetTagsName({
      username,
      host,
      password,
      space,
    });
    this.settingHandler.show();
  };

  handleTgasNameChange = checkedList => {
    this.setState({
      checkedList,
    });
  };

  render() {
    const { vertexes, edges, selectVertexes, actionData } = this.props;
    const { width, height, checkedList } = this.state;
    return (
      <div
        className="graph-wrap"
        ref={(ref: HTMLDivElement) => (this.ref = ref)}
      >
        {selectVertexes.length !== 0 && <Panel />}
        {actionData.length !== 0 && (
          <Button className="history-undo" onClick={this.handleUndo}>
            {intl.get('explore.undo')}
          </Button>
        )}
        <Button className="history-undo" onClick={this.handleSetting}>
          {intl.get('explore.setting')}
        </Button>
        <NebulaD3
          width={width}
          height={height}
          checkedList={checkedList}
          data={{
            vertexes,
            edges,
            selectIdsMap: selectVertexes.reduce((dict: any, vertex: INode) => {
              dict[vertex.name] = true;
              return dict;
            }, {}),
          }}
          onMouseInNode={this.handleMouseInNode}
          onMouseOutNode={this.handleMouseOutNode}
          onSelectVertexes={this.handleSelectVertexes}
        />
        <Modal
          wrapClassName="graph-setting"
          handlerRef={handler => (this.settingHandler = handler)}
          onOk={() => this.settingHandler.hide()}
        >
          <Setting
            checkedList={checkedList}
            onTgasNameChange={this.handleTgasNameChange}
          />
        </Modal>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(NebulaGraph);
