import { Button, Dropdown, Menu, message } from 'antd';
import * as d3 from 'd3';
import { saveAs } from 'file-saver';
import json2csv from 'json2csv';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { DownOutlined } from '@ant-design/icons';
import IconFont from '#app/components/Icon';
import { exportDataToCSV } from '#app/config/explore';
import { IRootState } from '#app/store';
import { trackEvent } from '#app/utils/stat';

import './index.less';
function save(dataBlob, _filesize) {
  saveAs(dataBlob, 'Graph.png');
}

function svgString2Image(svgString, size, callback) {
  const imgsrc =
    'data:image/svg+xml;base64,' +
    btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d') as any;
  const { width, height } = size;
  canvas.width = width;
  canvas.height = height;
  const image = new Image();
  image.onload = () => {
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    // fill white backgroud color
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);

    canvas.toBlob((blob: any) => {
      if (!blob) {
        // TODO: toBlob return null when size of canvas is to large,like 20000 * 20000
        return message.warning(intl.get('explore.toBlobError'));
      }
      const filesize = Math.round(blob.length / 1024) + ' KB';
      if (callback) {
        trackEvent('explore', 'export_graph_png');
        callback(blob, filesize);
      }
    });
  };

  image.src = imgsrc;
}

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
});

const mapDispatch = () => ({});
interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {
  disabled: boolean;
}

class ExportButton extends React.PureComponent<IProps> {
  handleExportImg = () => {
    const svg = d3.select('#output-graph') as any;
    if (svg) {
      const _svgNode = svg.node().cloneNode(true);
      const size = svg.node().getBBox();
      _svgNode.setAttribute(
        'viewBox',
        size.x + ' ' + size.y + ' ' + size.width + ' ' + size.height,
      );
      _svgNode.setAttribute('width', size.width);
      _svgNode.setAttribute('height', size.height);
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(_svgNode);
      svgString2Image(svgString, size, save);
    }
  };

  downloadCSVFiles({ headers, tables, type }) {
    try {
      const result = json2csv.parse(tables, {
        fields: headers,
      });
      // Determine browser type
      if (
        (navigator.userAgent.indexOf('compatible') > -1 &&
          navigator.userAgent.indexOf('MSIE') > -1) ||
        navigator.userAgent.indexOf('Edge') > -1
      ) {
        // IE10 or Edge browsers
        const BOM = '\uFEFF';
        const csvData = new Blob([BOM + result], { type: 'text/csv' });
        // @ts-ignore
        navigator.msSaveBlob(csvData, `test.csv`);
      } else {
        // Non-Internet Explorer
        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + result;
        // Use the download property of the A tag to implement the download function
        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = `${type}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert(err);
    }
  }

  handleExportCSV = () => {
    const { vertexes, edges } = this.props;
    exportDataToCSV(vertexes, 'vertex');
    exportDataToCSV(edges, 'edge');
  };
  render() {
    const { disabled } = this.props;
    const menu = (
      <Menu>
        <Menu.Item
          disabled={disabled}
          data-track-category="explore"
          data-track-action="export_img"
          data-track-label="from_control"
          onClick={this.handleExportImg}
        >
          <IconFont type="iconstudio-exportimage" />
          {intl.get('explore.exportToImg')}
        </Menu.Item>
        <Menu.Item
          disabled={disabled}
          data-track-category="explore"
          data-track-action="export_csv"
          data-track-label="from_control"
          onClick={this.handleExportCSV}
        >
          <IconFont type="iconstudio-exportcsv" />
          {intl.get('explore.exportToCSV')}
        </Menu.Item>
      </Menu>
    );
    return (
      <Dropdown overlay={menu}>
        <Button className="btn-export">
          {intl.get('explore.export')}
          <DownOutlined className="btn-icon" />
        </Button>
      </Dropdown>
    );
  }
}
export default connect(mapState, mapDispatch)(ExportButton);
