import { Button, message } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#app/store';

const mapState = (state: IRootState) => ({
  vertexesConfig: state.importData.vertexesConfig,
  edgesConfig: state.importData.edgesConfig,
  activeStep: state.importData.activeStep,
  currentSpace: state.nebula.currentSpace,
  username: state.nebula.username,
  host: state.nebula.host,
});

const mapDispatch = (dispatch: IDispatch) => ({
  nextStep: dispatch.importData.nextStep,
  testImport: dispatch.importData.testImport,
  asyncTestDataMapping: dispatch.importData.asyncTestDataMapping,
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {}

class Next extends React.Component<IProps> {
  constructor(props) {
    super(props);
  }

  handleNext = async() => {
    const {
      vertexesConfig,
      edgesConfig,
      activeStep,
      asyncTestDataMapping,
    } = this.props;
    const configInfo = {
      vertexesConfig,
      edgesConfig,
      activeStep,
    };
    if (!vertexesConfig.length && activeStep === 2) {
      this.props.nextStep();
      return;
    }
    if (!edgesConfig.length && activeStep === 3) {
      this.props.nextStep();
      return;
    }
    const code: any = await asyncTestDataMapping(configInfo);
    if (code === 0) {
      message.success(intl.get('import.importConfigValidationSuccess'));
      this.props.nextStep();
    } else {
      message.error(intl.get('import.importErrorInfo'));
    }
  };

  render() {
    return (
      <Button type="primary" className="next" onClick={this.handleNext}>
        {intl.get('import.next')}
      </Button>
    );
  }
}

export default connect(mapState, mapDispatch)(Next);
