import React from 'react';
import { connect } from 'react-redux';


import ConfigEdge from './ConfigEdge';
import ConfigNode from './ConfigVertex';
import Import from './Import';
import Init from './Init';
import Upload from './Upload';
import { IRootState } from '#app/store';

const mapState = (state: IRootState) => ({
  activeStep: state.importData.activeStep,
});

const mapDispatch = () => ({});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {}

const Tasks = (props: IProps) => {
  switch (props.activeStep) {
    case 0:
      return <Init />;
    case 1:
      return <Upload />;
    case 2:
      return <ConfigNode />;
    case 3:
      return <ConfigEdge />;
    case 4:
      return <Import />;
    default:
      return null;
  }
};

export default connect(mapState, mapDispatch)(Tasks);
