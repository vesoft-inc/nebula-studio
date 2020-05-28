import { Button, Popconfirm, Steps } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

const { Step } = Steps;

const mapState = (state: IRootState) => ({
  activeStep: state.importData.activeStep,
  currentStep: state.importData.currentStep,
  isImporting: state.importData.isImporting,
});

const mapDispatch = (dispatch: IDispatch) => ({
  resetAllConfig: dispatch.importData.resetAllConfig,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class Progress extends React.Component<IProps, {}> {
  stepsStatus = index => {
    const { currentStep, activeStep } = this.props;
    if (index === activeStep) {
      return 'process';
    }
    return index < currentStep ? 'finish' : 'wait';
  };

  render() {
    const steps = [
      {
        title: intl.get('import.selectSpace'),
      },
      {
        title: intl.get('import.uploadFile'),
      },
      {
        title: intl.get('import.vertex'),
      },
      {
        title: intl.get('import.edge'),
      },
      {
        title: intl.get('import.import'),
      },
    ];
    const { activeStep, isImporting } = this.props;
    return (
      <div className="nav-import">
        <Steps size="small" current={activeStep}>
          {steps.map((step, index) => (
            <Step
              title={step.title}
              key={index}
              status={this.stepsStatus(index)}
            />
          ))}
        </Steps>
        {!isImporting && (
          <Popconfirm
            placement="left"
            title={intl.get('import.clearAllConfigInfo')}
            onConfirm={this.props.resetAllConfig}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" type="default" className="rest-import">
              {intl.get('import.reset')}
            </Button>
          </Popconfirm>
        )}
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Progress);
