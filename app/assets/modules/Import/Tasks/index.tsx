import React from 'react';
import { connect } from 'react-redux';

import { IRootState } from '#assets/store';

import ConfigEdge from './ConfigEdge';
import ConfigNode from './ConfigNode';
import Import from './Import';
import Init from './Init';

const mapState = (state: IRootState) => ({
  currentStep: state.importData.progress.currentStep,
});

const mapDispatch = () => ({});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

const Tasks = (props: IProps) => {
  switch (props.currentStep) {
    case 'init':
      return <Init />;
    case 'configNode':
      return <ConfigNode />;
    case 'configEdge':
      return <ConfigEdge />;
    case 'import':
      return <Import />;
  }
};

export default connect(
  mapState,
  mapDispatch,
)(Tasks);
