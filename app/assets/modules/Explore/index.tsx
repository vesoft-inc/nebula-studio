import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IRootState } from '#assets/store';
import { trackPageView } from '#assets/utils/stat';

import Control from './Control';
import './index.less';
import Init from './Init';
import InitVertexes from './InitVertexes';
import NebulaGraph from './NebulaGraph';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
});

type IProps = ReturnType<typeof mapState>;

class Explore extends React.Component<IProps, {}> {
  controlComponent;
  componentDidMount() {
    trackPageView('/explore');
  }
  onRef = ref => {
    this.controlComponent = ref;
  };
  handleSearch = () => {
    this.controlComponent.handleSearch();
  };
  render() {
    return (
      <div className="nebula-explore">
        <Control onRef={this.onRef} />
        <NebulaGraph />
        <Init />
        <InitVertexes />
        {this.props.vertexes.length === 0 && (
          <div className="text-prompt">
            <img
              className="empty-board"
              src="https://cloud-cdn.nebula-graph.com.cn/studio-resource/explore-empty.png"
            />
            <div>
              <span>{intl.get('explore.noVertexPrompt')}</span>
              <span className="btn" onClick={this.handleSearch}>
                {intl.get('explore.search')}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect(mapState)(Explore);
