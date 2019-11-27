import { Steps } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

const { Step } = Steps;

const mapState = (state: IRootState) => ({
  currentStep: state.importData.currentStep,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateStep: step => {
    dispatch.importData.update({
      currentStep: step,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class Progress extends React.Component<IProps, {}> {
  handleSwitchStep = step => {
    this.props.updateStep(step);
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
    const { currentStep } = this.props;

    return (
      <Steps onChange={this.handleSwitchStep} current={currentStep}>
        {steps.map((step, index) => (
          <Step title={step.title} key={index} />
        ))}
      </Steps>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Progress);
