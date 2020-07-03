import { Checkbox, Col, Row } from 'antd';
import React from 'react';

// import intl from 'react-intl-universal';

interface IProps {
  showFields: string[];
  fields: any[];
  onNameChange: (showFields) => void;
}

class Setting extends React.Component<IProps, {}> {
  nameToOptions = (tag: string, name: any) => {
    const { showFields } = this.props;
    return name.map(itme => {
      return (
        <Col span={12} key={`${tag}.${itme}`}>
          <Checkbox
            value={`${tag}.${itme}`}
            disabled={!showFields.includes(`${tag}.type`) && itme === '_rank'}
          >
            {' '}
            {`${tag}.${itme}`}
          </Checkbox>
        </Col>
      );
    });
  };

  renderTagName() {
    const { fields } = this.props;
    return fields.map(itme => {
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
    const { showFields, onNameChange } = this.props;
    return (
      <>
        <Checkbox.Group onChange={onNameChange} value={showFields}>
          {this.renderTagName()}
        </Checkbox.Group>
      </>
    );
  }
}

export default Setting;
