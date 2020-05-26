import { Button } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

const mapState = (state: IRootState) => ({
  activeStep: state.importData.activeStep,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateActiveStep: step => {
    dispatch.importData.update({
      activeStep: step,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  disabled?: boolean;
}

class Prev extends React.Component<IProps> {
  constructor(props) {
    super(props);
  }

  handleGoBack = async () => {
    const { activeStep, updateActiveStep } = this.props;
    updateActiveStep(activeStep - 1);
  };

  render() {
    const { disabled = false } = this.props;

    return (
      <Button className="prev" onClick={this.handleGoBack} disabled={disabled}>
        {intl.get('import.goback')}
      </Button>
    );
  }
}

export default connect(mapState, mapDispatch)(Prev);
