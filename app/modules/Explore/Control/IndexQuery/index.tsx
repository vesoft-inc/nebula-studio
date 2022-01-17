import { FormComponentProps } from 'antd/lib/form/Form';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#app/store';

import IndexIntroduction from './IndexIntroduction';
import IndexMatch from './IndexMatch';

const mapState = (state: IRootState) => ({
  indexes: state.nebula.indexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetIndexTree: dispatch.nebula.asyncGetIndexTree,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {
  closeHandler: any;
}

class IndexQuery extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  componentDidMount() {
    this.fetchInfo();
  }

  async fetchInfo() {
    this.props.asyncGetIndexTree('TAG');
  }

  render() {
    return (
      <>
        {this.props.indexes.length === 0 ? (
          <IndexIntroduction />
        ) : (
          <IndexMatch closeHandler={this.props.closeHandler} />
        )}
      </>
    );
  }
}

export default connect(mapState, mapDispatch)(IndexQuery);
