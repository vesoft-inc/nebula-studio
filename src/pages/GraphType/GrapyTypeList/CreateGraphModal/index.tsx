import { Grid } from '@mui/material';
import { Modal } from '@vesoft-inc/ui-components';

import { Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CheckboxElement, FormContainer, TextFieldElement, useForm } from 'react-hook-form-mui';
import { useEffect } from 'react';
import { useModal, useStore } from '@/stores';

export interface CreateGraphFormValues {
  graphType: string;
  graphName: string;
  ifNotExists: boolean;
}

interface CreateGraphModalProps {
  open: boolean;
  graphType: string;
  onCancel: () => void;
}

const CreateGraphModal = (props: CreateGraphModalProps) => {
  const { open, onCancel, graphType } = props;
  const theme = useTheme();
  const form = useForm<CreateGraphFormValues>();

  const { graphtypeStore } = useStore();
  const { message } = useModal();

  const { t } = useTranslation(['graphtype', 'common']);

  const onSubmit = async (values: CreateGraphFormValues) => {
    const { graphName, ifNotExists } = values;
    const res = await graphtypeStore.createGraph(graphName, graphType, ifNotExists);
    if (res.code === 0) {
      message.success(t('createGraphSuccess', { ns: 'graphtype' }));
      graphtypeStore.getGraphTypeList();
      onCancel?.();
    } else {
      message.error(res.message);
    }
  };

  useEffect(() => {
    form.reset({
      graphType,
      graphName: '',
      ifNotExists: true,
    });
  }, [graphType]);

  return (
    <Modal
      title={t('createGraph', { ns: 'graphtype' })}
      open={open}
      slotProps={{
        footer: {
          onOk: form.handleSubmit(onSubmit),
        },
      }}
      onCancel={onCancel}
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
