import { Form, Select } from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

import './index.less';

const Option = Select.Option;
const FormItem = Form.Item;

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
  spaces: state.nebula.spaces,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpaces: dispatch.nebula.asyncGetSpaces,
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

class Explore extends React.Component<IProps, {}> {
  componentDidMount() {
    const { host, username, password } = this.props;
    this.props.asyncGetSpaces({
      host,
      username,
      password,
    });
  }

  render() {
    const { spaces } = this.props;

    return (
      <div className="nebula-explore">
        <div className="operation">
          <FormItem
            label="Spaces: "
            wrapperCol={{ span: 20 }}
            labelCol={{ span: 4 }}
          >
            <Select>
              {spaces.map(space => (
                <Option value={space} key={space}>
                  {space}
                </Option>
              ))}
            </Select>
          </FormItem>
        </div>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Explore);
