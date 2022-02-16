import { Checkbox, Col, Row } from 'antd';
import React from 'react';

import './setting.less';
interface IProps {
  value: string[];
  fields: any[];
  onNameChange: (showFields) => void;
}

class Setting extends React.PureComponent<IProps> {
  nameToOptions = (tag: string, name: any) => {
    const { value } = this.props;
    return name.map(itme => {
      return (
        <Col key={`${tag}.${itme}`} span={12}>
          <Checkbox
            value={`${tag}.${itme}`}
            disabled={!value.includes(`${tag}.type`) && itme === '_rank'}
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
          <div className="props">{this.nameToOptions(tag, name)}</div>
        </Row>
      );
    });
  }

  render() {
    const { value, onNameChange } = this.props;
    return (
      <>
        <Checkbox.Group
          onChange={onNameChange}
          value={value}
          className="checkbox-props"
        >
          {this.renderTagName()}
        </Checkbox.Group>
      </>
    );
  }
}

export default Setting;
