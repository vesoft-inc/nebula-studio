import { Button, Checkbox, Popconfirm, Table, Upload } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import CSVPreviewLink from '#app/components/CSVPreviewLink';
import service from '#app/config/service';
import { IDispatch, IRootState } from '#app/store';
import { trackPageView } from '#app/utils/stat';

import Prev from './Prev';
import './Upload.less';
const mapState = (state: IRootState) => ({
  files: state.importData.files,
  uploadDir: state.importData.uploadDir,
  loading:
    !!state.loading.effects.app.asyncGetImportFiles ||
    !!state.loading.effects.app.asyncUploadFile,
});

const mapDispatch = (dispatch: IDispatch) => ({
  nextStep: dispatch.importData.nextStep,
  asyncGetImportFiles: dispatch.app.asyncGetImportFiles,
  asyncUploadFile: dispatch.app.asyncUploadFile,
  updateFiles: files => {
    dispatch.importData.update({
      files,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class Import extends React.Component<IProps> {
  previewHandler;
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.getFiles();
    trackPageView('/import/upload');
  }

  getFiles = async () => {
    const { code, data } = await this.props.asyncGetImportFiles();
    if (code === 0) {
      this.props.updateFiles(data);
    }
  };

  handleNext = () => {
    this.props.nextStep();
  };

  transformFile = async file => {
    const { uploadDir } = this.props;
    file.path = `${uploadDir}/${file.name}`;
    file.withHeader = false;
    return file;
  };

  handleFileDelete = async index => {
    const { files } = this.props;
    const data: any = await service.deteleFile({
      filename: files[index].name,
    });
    if (data.code === 0) {
      this.props.updateFiles(files.filter((_, i) => i !== index));
    }
  };

  renderFileTable = () => {
    const { files, loading } = this.props;
    const columns = [
      {
        title: intl.get('import.fileName'),
        dataIndex: 'name',
      },
      {
        title: intl.get('import.withHeader'),
        key: 'withHeader',
        render: () => <Checkbox disabled={true} />,
      },
      {
        title: intl.get('import.fileSize'),
        key: 'size',
        dataIndex: 'size',
        render: size => {
          if (size < 1000) {
            return `${size} B`;
          } else if (size < 1000000) {
            return `${(size / 1000).toFixed(1)} KB`;
          } else if (size < 1000000000) {
            return `${(size / 1000000).toFixed(1)} MB`;
          } else {
            return `${(size / 1000000000).toFixed(1)} GB`;
          }
        },
      },
      {
        title: intl.get('common.operation'),
        key: 'operation',
        render: (_1, file, index) => {
          if (file.content) {
            return (
              <div className="operation">
                <div>
                  <CSVPreviewLink file={file}>
                    {intl.get('import.preview')}
                  </CSVPreviewLink>
                  <Popconfirm
                    onConfirm={() => this.handleFileDelete(index)}
                    title={intl.get('common.ask')}
                    okText={intl.get('common.ok')}
                    cancelText={intl.get('common.cancel')}
                  >
                    <Button type="link">{intl.get('common.delete')}</Button>
                  </Popconfirm>
                </div>
              </div>
            );
          }
        },
      },
    ];

    return (
      <Table
        loading={!!loading}
        dataSource={files}
        columns={columns}
        rowKey="name"
        pagination={false}
      />
    );
  };

  handleUpdate = async (options: any) => {
    const data = new FormData();
    data.append('file', options.file);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    await this.props.asyncUploadFile(data, config).then(_ => {
      this.getFiles();
    });
  };
  render() {
    const { files, loading } = this.props;
    return (
      <div className="upload task">
        <div className="files">
          <div className="title">
            <h3>{intl.get('import.fileTitle')}</h3>
            <Upload
              multiple={true}
              accept=".csv"
              showUploadList={false}
              fileList={files}
              method="PUT"
              headers={{
                'content-type': 'multipart/form-data',
              }}
              customRequest={this.handleUpdate}
              transformFile={this.transformFile as any}
            >
              <Button className="upload-btn" type="default">
                {intl.get('import.uploadFile')}
              </Button>
            </Upload>
          </div>
          {this.renderFileTable()}
        </div>
        <div className="btns-import-step">
          <Prev />
          <Button
            type="primary"
            className="next"
            disabled={!files.length || loading}
            onClick={this.handleNext}
          >
            {intl.get('import.next')}
          </Button>
        </div>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Import);
