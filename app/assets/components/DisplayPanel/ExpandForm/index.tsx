import { Button, Tabs, Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import IconFont from '#assets/components/Icon';
import { exportDataToCSV } from '#assets/config/explore';
import { IRootState } from '#assets/store';
import { INode, IPath } from '#assets/utils/interface';

import ExpandItem from '../ExpandItem';
import SelectedGraphDetailShowModal from '../SelectedGraphDetailShowModal';
import './index.less';
const TabPane = Tabs.TabPane;

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
  selectEdges: state.explore.selectEdges,
});

interface IProps extends ReturnType<typeof mapState> {
  close: () => void;
}

interface IState {
  tagType: 'vertex' | 'edge';
}

class DisplayComponent extends React.PureComponent<IProps, IState> {
  SelectedGraphDetailShowModal;
  constructor(props: IProps) {
    super(props);
    this.state = {
      tagType: 'vertex',
    };
  }
  showModal = () => {
    const { tagType } = this.state;
    this.SelectedGraphDetailShowModal.show(tagType);
  };

  handleChangeType = async (key: string) => {
    this.setState({
      tagType: key,
    } as Pick<IState, keyof IState>);
  };

  exportDataToCSV = () => {
    const { selectVertexes, selectEdges } = this.props;
    const { tagType } = this.state;
    const data = tagType === 'vertex' ? selectVertexes : selectEdges;
    exportDataToCSV(data, tagType);
  };

  flattenProps = data => {
    if (data.nodeProp && data.nodeProp.properties) {
      return this.flattenVertex(data);
    } else if (data.edgeProp && data.edgeProp.properties) {
      return this.flattenEdge(data);
    }
  };

  flattenVertex = data => {
    const _data = [
      {
        key: 'vid',
        value: data.name,
      },
    ];
    const properties = data.nodeProp.properties;
    Object.keys(properties).forEach(property => {
      const valueObj = properties[property];
      Object.keys(valueObj).forEach(field => {
        _data.push({
          key: `${property}.${field}`,
          value: valueObj[field],
        });
      });
    });
    return _data;
  };

  flattenEdge = data => {
    const _data = [
      {
        key: 'id',
        value: data.id,
      },
    ];
    const name = data.type;
    const properties = data.edgeProp.properties;
    Object.keys(properties).forEach(property => {
      const value = properties[property];
      _data.push({
        key: `${name}.${property}`,
        value,
      });
    });
    return _data;
  };

  render() {
    const { selectVertexes, selectEdges, close } = this.props;
    const { tagType } = this.state;
    const data = tagType === 'vertex' ? selectVertexes : selectEdges;
    return (
      <div className="display-expand">
        <div className="header">
          <Tabs onChange={this.handleChangeType} defaultActiveKey={tagType}>
            <TabPane
              tab={intl.get('import.vertexText') + `(${selectVertexes.length})`}
              key="vertex"
            />
            <TabPane
              tab={intl.get('import.edgeText') + `(${selectEdges.length})`}
              key="edge"
            />
          </Tabs>
          <div
            className={data.length > 0 ? 'btn-view' : 'btn-disabled'}
            onClick={data.length > 0 ? this.showModal : undefined}
            data-track-category="explore"
            data-track-action="select_info_modal_view"
          >
            <Tooltip title={intl.get('explore.viewDetails')}>
              <IconFont type="iconstudio-window" />
            </Tooltip>
          </div>
        </div>
        <div className="content">
          {data.length > 0 &&
            data.map((item: INode | IPath, index) => (
              <ExpandItem
                key={item.uuid}
                data={this.flattenProps(item)}
                title={`${tagType} ${index + 1}`}
                index={index}
              />
            ))}
          {data.length === 0 && (
            <div className="empty-tip">
              <IconFont type="iconDefault-image-left" />
              <span>{intl.get('common.noSelectedData')}</span>
            </div>
          )}
        </div>
        <div className="footer">
          <Button
            disabled={data.length === 0}
            data-track-category="explore"
            data-track-action="export_csv"
            data-track-label="from_left_sider"
            onClick={
              data.length > 0
                ? _.debounce(this.exportDataToCSV, 300)
                : undefined
            }
          >
            <IconFont type="iconstudio-exportcsv" />
            {tagType === 'vertex'
              ? intl.get('common.exportSelectVertexes')
              : intl.get('common.exportSelectEdges')}
          </Button>
          <IconFont
            type="iconstudio-indentright"
            data-track-category="explore"
            data-track-action="display_sider_close"
            onClick={close}
          />
        </div>
        <SelectedGraphDetailShowModal
          handlerRef={modal => (this.SelectedGraphDetailShowModal = modal)}
          vertexes={selectVertexes}
          edges={selectEdges}
        />
      </div>
    );
  }
}

export default connect(mapState)(DisplayComponent);
