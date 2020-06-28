import { Button, Checkbox, message, Popconfirm, Table, Upload } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import CSVPreviewLink from '#assets/components/CSVPreviewLink';
import service from '#assets/config/service';
import { IDispatch, IRootState } from '#assets/store';
import readFileContent from '#assets/utils/file';
import { trackPageView } from '#assets/utils/stat';

import Prev from './Prev';
import './Upload.less';

const mapState = (state: IRootState) => ({
  files: state.importData.files,
  mountPath: state.importData.mountPath,
});

const mapDispatch = (dispatch: IDispatch) => ({
  nextStep: dispatch.importData.nextStep,
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
    service.getFiles().then((data: any) => {
      if (data.code === 0) {
        this.props.updateFiles(data.data);
      }
    });
    trackPageView('/import/upload');
  }

  handleNext = () => {
    this.props.nextStep();
  };

  transformFile = async file => {
    const { mountPath } = this.props;
    // read the file under max size
    const MAX_FILE_SIZE = 5000;
    const content = (await readFileContent(
      file.slice(0, MAX_FILE_SIZE),
    )) as any;
    file.content = content
      .split('\n')
      .slice(0, 3)
      .join('\n');
    file.path = `${mountPath}/${file.name}`;
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
    const { files } = this.props;
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
        title: intl.get('import.operation'),
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
                    <Button type="link">{intl.get('import.delete')}</Button>
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
        dataSource={files}
        columns={columns}
        rowKey="name"
        pagination={false}
      />
    );
  };

  handleUploadChange = ({ fileList }) => {
    const files = fileList.filter(file => file.size / 1024 / 1024 < 100);
    this.props.updateFiles(_.uniqBy(files, 'name'));
  };

  handleBeforeUpload = file => {
    const isOverSize = file.size / 1000 / 1000 < 100;
    if (!isOverSize) {
      message.error(intl.get('import.fileSizeErrorMsg'));
      return Promise.reject(false);
    }
    return Promise.resolve(file);
  };

  render() {
    const { files } = this.props;
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
              action={'/api/files/upload'}
              onChange={this.handleUploadChange}
              beforeUpload={this.handleBeforeUpload}
              transformFile={this.transformFile as any}
            >
              <Button className="upload-btn" type="default">
                {intl.get('import.uploadFile')}
              </Button>
            </Upload>
          </div>
          {this.renderFileTable()}
        </div>
        <Prev />
        <Button
          type="primary"
          className="next"
          disabled={!files.length}
          onClick={this.handleNext}
        >
          {intl.get('import.next')}
        </Button>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Import);
