import { Checkbox, Col, Row } from 'antd';
import React from 'react';

// import intl from 'react-intl-universal';

interface IProps {
  showFields: string[];
  tagsFields: any[];
  onTgasNameChange: (showFields) => void;
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
    const { tagsFields } = this.props;
    return tagsFields.map(itme => {
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
    const { showFields, onTgasNameChange } = this.props;
    return (
      <>
        <Checkbox.Group onChange={onTgasNameChange} value={showFields}>
          {this.renderTagName()}
        </Checkbox.Group>
      </>
    );
  }
}

export default Setting;
