import { Button, Form, Select } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { FormInstance } from 'antd/es/form';

import { IDispatch, IRootState } from '#app/store';
import { trackPageView } from '#app/utils/stat';

import './Init.less';

const mapState = (state: IRootState) => ({
  spaces: state.nebula.spaces,
  currentSpace: state.nebula.currentSpace,
  currentStep: state.importData.currentStep,
  uploadDir: state.importData.uploadDir,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpaces: dispatch.nebula.asyncGetSpaces,
  asyncSwitchSpace: async space => {
    await dispatch.nebula.asyncSwitchSpace(space);
    await dispatch.nebula.asyncGetTags();
    await dispatch.nebula.asyncGetEdges();
    await dispatch.explore.clear();
  },
  asyncGetTags: dispatch.nebula.asyncGetTags,
  asyncGetImportWorkingDir: dispatch.importData.asyncGetImportWorkingDir,
  asyncGetEdges: dispatch.nebula.asyncGetEdges,
  nextStep: dispatch.importData.nextStep,
});

const { Option } = Select;
const FormItem = Form.Item;

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {}

class Init extends React.Component<IProps> {
  formRef = React.createRef<FormInstance>()
  componentDidMount() {
    this.props.asyncGetImportWorkingDir();
    this.props.asyncGetSpaces();

    trackPageView('/import/init');
  }

  handleNext = () => {
    this.formRef.current!.validateFields().then(values => {
      const { space } = values;
      if (space) {
        this.props.asyncSwitchSpace(space);
        this.props.nextStep();
      }
    });
  };

  render() {
    const {
      spaces,
      currentSpace,
      currentStep,
      uploadDir,
    } = this.props;
    return (
      <div className="init task">
        <Form layout="inline" ref={this.formRef}>
          <FormItem label={intl.get('common.currentSpace')} name="space" initialValue={currentSpace} rules={[{ required: true }]}>
            <Select disabled={currentStep > 0}>
              {spaces.map(space => (
                <Option value={space} key={space}>
                  {space}
                </Option>
              ))}
            </Select>
          </FormItem>
        </Form>
        <FormItem noStyle={true}>
          {({ getFieldValue }) =>
            <Button
              type="primary"
              className="next"
              onClick={this.handleNext}
              disabled={!getFieldValue('space') || !uploadDir}
            >
              {intl.get('import.next')}
            </Button>
          }
        </FormItem>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Init);
