import { Steps } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

const { Step } = Steps;

const mapState = (state: IRootState) => ({
  activeStep: state.importData.activeStep,
  currentStep: state.importData.currentStep,
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
    ReturnType<typeof mapDispatch> {}

class Progress extends React.Component<IProps, {}> {
  handleSwitchStep = step => {
    const { currentStep } = this.props;
    if (step <= currentStep) {
      this.props.updateActiveStep(step);
    }
  };

  render() {
    const steps = [
      {
        title: intl.get('import.init'),
      },
      {
        title: intl.get('import.upload'),
      },
      {
        title: intl.get('import.vertex'),
      },
      {
        title: intl.get('import.edge'),
      },
      {
        title: intl.get('common.import'),
      },
    ];
    const { currentStep, activeStep } = this.props;

    return (
      <Steps
        type="navigation"
        onChange={this.handleSwitchStep}
        current={activeStep}
      >
        {steps.map((step, index) => (
          <Step
            title={step.title}
            key={index}
            status={index <= currentStep ? 'finish' : 'wait'}
          />
        ))}
      </Steps>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Progress);
