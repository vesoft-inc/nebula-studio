import { Checkbox, Col, Row } from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import { IRootState } from '#assets/store';

// import intl from 'react-intl-universal';

const mapState = (state: IRootState) => ({
  tagsName: state.nebula.tagsName,
});

interface IProps extends ReturnType<typeof mapState> {
  checkedList: string[];
  onTgasNameChange: () => void;
}

class Setting extends React.Component<IProps, {}> {
  nameToOptions = (tag: string, name: any) => {
    return name.map(itme => {
      return (
        <Col span={12} key={`${tag}.${itme}`}>
          <Checkbox value={`${tag}.${itme}`}> {`${tag}.${itme}`}</Checkbox>
        </Col>
      );
    });
  };

  renderTagName() {
    const { tagsName } = this.props;
    return tagsName.map(itme => {
      const tag = Object.keys(itme)[0];
      const name = Object.values(itme)[0];
      return (
        <Row key={tag}>
          <h3>{tag}</h3>
          {this.nameToOptions(tag, name)}
        </Row>
      );
    });
  }

  render() {
    const { checkedList, onTgasNameChange } = this.props;
    return (
      <>
        <Checkbox.Group onChange={onTgasNameChange} value={checkedList}>
          {this.renderTagName()}
        </Checkbox.Group>
      </>
    );
  }
}

export default connect(mapState)(Setting);
