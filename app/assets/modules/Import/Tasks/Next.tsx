import { Button, message } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

const mapState = (state: IRootState) => ({
  vertexesConfig: state.importData.vertexesConfig,
  edgesConfig: state.importData.edgesConfig,
  mountPath: state.importData.mountPath,
  activeStep: state.importData.activeStep,
  currentSpace: state.nebula.currentSpace,
  username: state.nebula.username,
  password: state.nebula.password,
  host: state.nebula.host,
});

const mapDispatch = (dispatch: IDispatch) => ({
  nextStep: dispatch.importData.nextStep,
  testImport: dispatch.importData.testImport,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class Next extends React.Component<IProps> {
  constructor(props) {
    super(props);
  }

  handleNext = async () => {
    const {
      currentSpace,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
      host,
      username,
      password,
    } = this.props;
    if (!vertexesConfig.length && activeStep === 2) {
      this.props.nextStep();
      return;
    }
    if (!edgesConfig.length && activeStep === 3) {
      this.props.nextStep();
      return;
    }
    const errCode: any = await this.props.testImport({
      currentSpace,
      vertexesConfig: activeStep === 2 ? vertexesConfig : [], // Step 3 validates only the current configuration
      edgesConfig: activeStep === 3 ? edgesConfig : [], // Step 4 validates only the current configuration
      mountPath,
      activeStep,
      host,
      username,
      password,
    });
    if (errCode === 0) {
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
