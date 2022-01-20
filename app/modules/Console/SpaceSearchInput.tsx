import { Select } from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '#app/store';

const { Option } = Select;

const mapState = (state: IRootState) => ({
  spaces: state.nebula.spaces,
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
    this.props.asyncGetSpaces();
  };

  render() {
    const { value, onSpaceChange, loading } = this.props;
    return (
      <Select
        showSearch={true}
        placeholder="space name"
        value={value}
        defaultActiveFirstOption={false}
        onChange={onSpaceChange}
        onFocus={this.getSpaces}
        className="space-search-input"
        loading={!!loading}
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
