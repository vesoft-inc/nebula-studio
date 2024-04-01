import { Grid } from '@mui/material';
import { Modal } from '@vesoft-inc/ui-components';

import { Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CheckboxElement, FormContainer, TextFieldElement, useForm } from 'react-hook-form-mui';

export interface CreateGraphFormValues {
  graphType: string;
  graphName: string;
  ifNotExists: boolean;
}

interface CreateGraphModalProps {
  open: boolean;
  onCancel: () => void;
}

const CreateGraphModal = (props: CreateGraphModalProps) => {
  const theme = useTheme();
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
    <Modal
      title={t('createGraph', { ns: 'graphtype' })}
      open={props.open}
      slotProps={{
        footer: {
          onOk: form.handleSubmit(onSubmit),
        },
      }}
      onCancel={props.onCancel}
    >
      <Box sx={{ padding: `${theme.spacing(2)} ${theme.spacing(3)}` }}>
        <FormContainer formContext={form}>
          <Grid container rowSpacing={2}>
            <Grid item md={12}>
              <TextFieldElement
                label={t('graphType', { ns: 'graphtype' })}
                name="graphType"
                disabled
                required
                fullWidth
              />
            </Grid>
            <Grid item md={12} rowSpacing={2}>
              <TextFieldElement label={t('graphName', { ns: 'graphtype' })} name="graphName" required fullWidth />
            </Grid>
            <Grid item md={12}>
              <CheckboxElement label={t('ifNotExsits', { ns: 'graphtype' })} name="ifNotExists" required />
            </Grid>
          </Grid>
        </FormContainer>
      </Box>
    </Modal>
    // <>
    //   <DialogContent dividers>

    //   </DialogContent>
    //   <ModalFooter
    //     cancelText={t('cancel', { ns: 'common' })}
    //     okText={t('create', { ns: 'common' })}
    //     onCancel={() => {
    //       modal.hide();
    //     }}
    //     onOk={form.handleSubmit(onSubmit)}
    //   />
    // </>
  );
};

export default CreateGraphModal;
