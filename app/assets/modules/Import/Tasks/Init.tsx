import { Button, Form, Input, Select } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

import './Init.less';

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
  spaces: state.nebula.spaces,
  currentSpace: state.nebula.currentSpace,
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
    this.props.asyncGetSpaces({
      host,
      username,
      password,
    });
  }

  handleNext = () => {
    this.props.form.validateFields((err, values: any) => {
      let { mountPath } = values;
      const { space } = values;
      if (mountPath.endsWith('/')) {
        mountPath = mountPath.substring(0, mountPath.length - 1);
      }
      const { username, host, password } = this.props;
      if (!err && space && mountPath) {
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
        this.props.nextStep({
          mountPath,
        });
      }
    });
  };

  render() {
    const {
      spaces,
      currentSpace,
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
              <Select>
                {spaces.map(space => (
                  <Option value={space} key={space}>
                    {space}
                  </Option>
                ))}
              </Select>,
            )}
          </FormItem>
          <FormItem label={intl.get('import.mountPath')}>
            {getFieldDecorator('mountPath', {
              initialValue: mountPath,
              rules: [
                {
                  required: true,
                },
              ],
            })(<Input placeholder={intl.get('import.mountPathPlaceholder')} />)}
          </FormItem>
        </Form>
        <Button
          type="primary"
          className="next"
          onClick={this.handleNext}
          disabled={!getFieldValue('space') || !getFieldValue('mountPath')}
        >
          {intl.get('import.next')}
        </Button>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Form.create()(Init));
