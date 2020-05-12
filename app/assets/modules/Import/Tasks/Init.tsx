import { Button, Form, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';
import { trackPageView } from '#assets/utils/stat';

import './Init.less';

const mapState = (state: IRootState) => ({
  spaces: state.nebula.spaces,
  currentSpace: state.nebula.currentSpace,
  currentStep: state.importData.currentStep,
  mountPath: state.importData.mountPath,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpaces: dispatch.nebula.asyncGetSpaces,
  asyncSwitchSpace: async space => {
    await dispatch.nebula.asyncSwitchSpace(space);
    await dispatch.nebula.asyncGetTags();
    await dispatch.nebula.asyncGetEdgeTypes();
  },
  asyncGetTags: dispatch.nebula.asyncGetTags,
  asyncGetImportWorkingDir: dispatch.importData.asyncGetImportWorkingDir,
  asyncGetEdgeTypes: dispatch.nebula.asyncGetEdgeTypes,
  nextStep: dispatch.importData.nextStep,
});

const { Option } = Select;
const FormItem = Form.Item;

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {}

class Init extends React.Component<IProps, {}> {
  componentDidMount() {
    this.props.asyncGetImportWorkingDir();
    this.props.asyncGetSpaces();

    trackPageView('/import/init');
  }

  handleNext = () => {
    this.props.form.validateFields((err, values: any) => {
      const { space } = values;
      if (!err && space) {
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
      mountPath,
      form: { getFieldDecorator, getFieldValue },
    } = this.props;
    return (
      <div className="init task">
        <Form layout="inline">
          <FormItem label="Spaces: ">
            {getFieldDecorator('space', {
              initialValue: currentSpace,
              rules: [
                {
                  required: true,
                },
              ],
            })(
              <Select disabled={currentStep > 0}>
                {spaces.map(space => (
                  <Option value={space} key={space}>
                    {space}
                  </Option>
                ))}
              </Select>,
            )}
          </FormItem>
        </Form>
        <Button
          type="primary"
          className="next"
          onClick={this.handleNext}
          disabled={!getFieldValue('space') || !mountPath}
        >
          {intl.get('import.next')}
        </Button>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Form.create()(Init));
