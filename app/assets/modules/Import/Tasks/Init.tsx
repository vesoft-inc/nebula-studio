import { Button, Form, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';
import { trackPageView } from '#assets/utils/stat';

import './Init.less';

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
  spaces: state.nebula.spaces,
  currentSpace: state.nebula.currentSpace,
  currentStep: state.importData.currentStep,
  mountPath: state.importData.mountPath,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpaces: dispatch.nebula.asyncGetSpaces,
  updateCurrentSpace: space => {
    dispatch.nebula.update({
      currentSpace: space,
    });
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
    const { host, username, password } = this.props;
    this.props.asyncGetImportWorkingDir();
    this.props.asyncGetSpaces({
      host,
      username,
      password,
    });

    trackPageView('/import/init');
  }

  handleNext = () => {
    this.props.form.validateFields((err, values: any) => {
      const { space } = values;
      const { username, host, password } = this.props;
      if (!err && space) {
        this.props.updateCurrentSpace(space);
        this.props.asyncGetTags({
          username,
          host,
          password,
          space,
        });
        this.props.asyncGetEdgeTypes({
          username,
          host,
          password,
          space,
        });
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
          {/* <FormItem label={intl.get('import.mountPath')}>
            {getFieldDecorator('mountPath', {
              initialValue: mountPath,
              rules: [
                {
                  required: true,
                },
              ],
            })(<Input placeholder={intl.get('import.mountPathPlaceholder')} />)}
          </FormItem> */}
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
