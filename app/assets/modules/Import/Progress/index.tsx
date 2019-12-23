import { Icon, Popconfirm, Steps } from 'antd';
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
  resetAllConfig: dispatch.importData.resetAllConfig,
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
      <div className="nav-import">
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
        <Popconfirm
          placement="left"
          title={intl.get('import.clearAllConfigInfo')}
          onConfirm={this.props.resetAllConfig}
          okText="Yes"
          cancelText="No"
        >
          <Icon type="delete" className="rest-import" />
        </Popconfirm>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Progress);
