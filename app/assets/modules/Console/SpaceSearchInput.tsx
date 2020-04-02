import { Select } from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#assets/store';

const { Option } = Select;

const mapState = (state: IRootState) => ({
  spaces: state.nebula.spaces,
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
  loading: state.loading.effects.nebula.asyncGetSpaces,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpaces: dispatch.nebula.asyncGetSpaces,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  onSpaceChange: (value: string) => void;
  value: string;
}

class SpaceSearchInput extends React.Component<IProps> {
  componentDidMount() {
    this.getSpaces();
  }
  getSpaces = () => {
    const { host, username, password } = this.props;
    this.props.asyncGetSpaces({
      host,
      username,
      password,
    });
  };

  render() {
    const { value, onSpaceChange, loading } = this.props;
    return (
      <Select
        showSearch={true}
        placeholder="space name"
        showArrow={false}
        value={value}
        defaultActiveFirstOption={false}
        onChange={onSpaceChange}
        onSearch={this.getSpaces}
        className="space-search-input"
        loading={!!loading}
        allowClear={true}
      >
        {this.props.spaces.map(s => (
          <Option value={s} key={s}>
            {s}
          </Option>
        ))}
      </Select>
    );
  }
}

export default connect(mapState, mapDispatch)(SpaceSearchInput);
