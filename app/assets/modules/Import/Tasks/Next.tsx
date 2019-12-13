import { Button, message } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import service from '#assets/config/service';
import { IDispatch, IRootState } from '#assets/store';

const mapState = (state: IRootState) => ({
  vertexesConfig: state.importData.vertexesConfig,
  edgesConfig: state.importData.edgesConfig,
  mountPath: state.importData.mountPath,
  currentStep: state.importData.currentStep,
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
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      currentStep,
    } = this.props;
    const result: any = await service.createConfigFile({
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      currentStep,
    });
    if (result.code === '0') {
      const code: any = await this.props.testImport({ localPath: mountPath });
      if (code === '0') {
        this.props.nextStep();
      } else {
        message.error(intl.get('import.importErrorIfno'));
      }
    } else {
      message.error(intl.get('import.createConfigError'));
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

export default connect(
  mapState,
  mapDispatch,
)(Next);
