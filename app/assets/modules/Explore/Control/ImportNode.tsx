import { Button, Form, Input } from 'antd';
import { FormComponentProps } from 'antd/lib/form/Form';
import React from 'react';
import intl from 'react-intl-universal';

import './ImportNode.less';

const TextArea = Input.TextArea;

interface IProps extends FormComponentProps {
  handler: any;
}

class ImportNodes extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="import-node">
        <h3>{intl.get('explore.importNode')}</h3>
        <Form>
          <Form.Item>
            {getFieldDecorator('nodes', {})(
              <TextArea
                placeholder={intl.get('explore.importPlaceholder')}
                rows={20}
              />,
            )}
          </Form.Item>
          <Form.Item className="btn-wrap">
            <Button type="default">{intl.get('explore.fileImport')}</Button>
            <Button type="primary">{intl.get('explore.import')}</Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

export default Form.create<IProps>()(ImportNodes);
