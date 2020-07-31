import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
interface IProps {
  tableData?: {
    headers: any[];
    tables: any[];
  };
}

export default class OutputCsv extends React.PureComponent<IProps> {
  getCsvDownloadUrl = () => {
    const { tableData } = this.props;
    if (!tableData) {
      return '';
    }
    const { headers = [], tables = [] } = tableData;
    const csv = [headers, ...tables.map(item => Object.values(item))]
      .map(row => row.join(','))
      .join('\n');

    if (!csv) {
      return '';
    }

    const _utf = '\uFEFF';
    if (window.Blob && window.URL && window.URL.createObjectURL) {
      const csvBlob = new Blob([_utf + csv], {
        type: 'text/csv',
      });
      return URL.createObjectURL(csvBlob);
    }
    return (
      'data:attachment/csv;charset=utf-8,' + _utf + encodeURIComponent(csv)
    );
  };

  render() {
    const url = this.getCsvDownloadUrl();

    return (
      url && (
        <a className="csv-export" href={url} download="result">
          {intl.get('common.output')}
        </a>
      )
    );
  }
}
