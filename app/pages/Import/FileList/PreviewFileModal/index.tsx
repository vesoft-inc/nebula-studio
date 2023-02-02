import { useI18n } from '@vesoft-inc/i18n';
import { Button, Checkbox, Input, Modal, Table, Form, Row, Col, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import React, { useCallback, useEffect } from 'react';
import { usePapaParse } from 'react-papaparse';
import { StudioFile } from '@app/interfaces/import';
import { observer } from 'mobx-react-lite';
import { useBatchState } from '@app/utils';
import { useStore } from '@app/stores';
import styles from './index.module.less';
interface IProps {
  file: StudioFile;
  children: any;
}

const PreviewFileModal = (props: IProps) => {
  const { children, file } = props;
  const { files: { updateFileConfig, getFiles } } = useStore();
  const [form] = Form.useForm();
  const { state, setState } = useBatchState({
    visible: false,
    data: [],
    columns: [],
    parseLoading: false,
    uploading: false,
  });
  const { intl } = useI18n();
  const { visible, data, parseLoading, uploading, columns } = state;
  const { name, withHeader, delimiter, sample } = file;
  const { readString } = usePapaParse();
  useEffect(() => {
    visible && (readFile(), form.setFieldsValue({ withHeader, delimiter }));
  }, [visible]);
  useEffect(() => {
    parseColumn(withHeader);
  }, [data]);
  const parseColumn = (withHeader: boolean) => {
    const columns = data[0]?.map((header, index) => {
      const textIndex = index;
      const title = withHeader ? header : `Column ${textIndex}`;
      return {
        title,
        dataIndex: index,
        render: value => <span className={styles.limitWidth}>{value}</span>,
      };
    }) || [];
    setState({ columns });
  };
  const readFile = useCallback((delimiter?: string) => {
    setState({ parseLoading: true });
    let data = [];
    readString(sample, { 
      delimiter: delimiter || file.delimiter, 
      worker: true, 
      skipEmptyLines: true,
      step: (row) => {
        data = [...data, row.data];
      },
      complete: () => {
        setState({ parseLoading: false, data });
      } 
    });
  }, [sample]);
  const handleConfirm = async () => {
    setState({ uploading: true });
    const { withHeader, delimiter } = form.getFieldsValue();
    const res = await updateFileConfig({
      name,
      withHeader,
      delimiter,
    });
    if (res.code === 0) {
      message.success(intl.get('common.updateSuccess'));
      getFiles();
    }
    setState({ uploading: false, visible: res.code !== 0 });
  };
  const handleCancel = () => !uploading && setState({ visible: false });
  const handlePreview = (e) => readFile(e.target.value || ',');
  const updateHeader = (e) => parseColumn(e.target.checked);
  return (
    <>
      <Modal
        title={intl.get('import.filePreview', { name })}
        open={visible}
        width={920}
        onCancel={() => handleCancel()}
        className={styles.previewModal}
        footer={false}
      >
        <div className={styles.container}>
          <Form form={form} layout="horizontal" initialValues={{
            withHeader,
            delimiter,
          }}>
            <Row className={styles.configOperation}>
              <Col span={3}>
                <Form.Item name="withHeader" valuePropName="checked">
                  <Checkbox onChange={updateHeader}>{intl.get('import.hasHeader')}</Checkbox>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={intl.get('import.delimiter')} name="delimiter" required={true}>
                  <Input placeholder="," onChange={handlePreview} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item noStyle shouldUpdate={true}>
              {({ getFieldValue }) => {
                const withHeader = getFieldValue('withHeader');
                return (
                  <div>
                    <span className={styles.sampleTitle}>{intl.get('import.sampleData')}</span>
                    <Table
                      loading={parseLoading}
                      className={styles.sampleTable}
                      dataSource={withHeader ? data.slice(1) : data}
                      columns={columns}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      rowKey={() => uuidv4()}
                    />
                  </div>
                );
              }}
            </Form.Item>
            <Form.Item noStyle>
              <div className={styles.btns}>
                <Button disabled={uploading} onClick={() => handleCancel()}>
                  {intl.get('common.cancel')}
                </Button>
                <Button
                  htmlType="submit"
                  type="primary"
                  loading={uploading}
                  onClick={() => handleConfirm()}
                >
                  {intl.get('common.confirm')}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Modal>
      <Button className="primaryBtn" onClick={() => setState({ visible: true })}>
        {children}
      </Button>
    </>
  );
};

export default observer(PreviewFileModal);
