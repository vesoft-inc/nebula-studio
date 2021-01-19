import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';

import { trackEvent } from '#assets/utils/stat';
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
    const csv = [
      headers,
      ...tables.map(values => headers.map(field => values[field])),
    ]
      .map(row =>
        // HACK: waiting for use case if there need to check int or string
        row.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(','),
      )
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
        <a
          className="csv-export ant-btn"
          href={url}
          download="result"
          onClick={() => {
            trackEvent('console', 'export_csv_file');
          }}
        >
          {intl.get('common.output')}
        </a>
      )
    );
  }
}
