import { useModal } from '@/stores';
import { DialogContent } from '@mui/material';
import { CheckboxElement, Form, ModalFooter, TextFieldElement } from '@vesoft-inc/ui-components';

import { Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const { useForm } = Form;

const formItemLayout = { xs: 12, xl: 12, lg: 12 };

export interface CreateGraphFormValues {
  graphType: string;
  graphName: string;
  ifNotExists: boolean;
}

const CreateGraphForm = () => {
  const theme = useTheme();
  const modal = useModal();
  const form = useForm<CreateGraphFormValues>({
    defaultValues: {
      graphType: 'GraphType-123',
      graphName: '',
      ifNotExists: true,
    },
  });

  const { t } = useTranslation(['graphtype', 'common']);

  const onSubmit = (values: CreateGraphFormValues) => {
    console.log('values', values);
  };

  return (
    <>
      <DialogContent dividers>
        <Box sx={{ padding: `${theme.spacing(2)} ${theme.spacing(3)}` }} width={500}>
          <Form
            form={form}
            layout={{
              rowSpacing: 2,
            }}
          >
            <Form.Item
              label={t('graphType', { ns: 'graphtype' })}
              name="graphType"
              disabled
              required
              layout={formItemLayout}
            >
              <TextFieldElement sx={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('graphName', { ns: 'graphtype' })} name="graphName" required layout={formItemLayout}>
              <TextFieldElement sx={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label={t('ifNotExsits', { ns: 'graphtype' })}
              name="ifNotExists"
              layout={{
                xs: 12,
              }}
              required
            >
              <CheckboxElement />
            </Form.Item>
          </Form>
        </Box>
      </DialogContent>
      <ModalFooter
        cancelText={t('cancel', { ns: 'common' })}
        okText={t('create', { ns: 'common' })}
        onCancel={() => {
          modal.hide();
        }}
        onOk={form.handleSubmit(onSubmit)}
      />
    </>
  );
};

export default CreateGraphForm;
