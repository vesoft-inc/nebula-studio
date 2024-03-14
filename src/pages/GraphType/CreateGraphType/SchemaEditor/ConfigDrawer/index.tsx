import { observer } from 'mobx-react-lite';
import { Button, Divider, Grid, Typography } from '@mui/material';
import { ContentCopyFilled, DeleteOutline } from '@vesoft-inc/icons';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';

import { ActionsContainer, NodeTypeInfoContainer, SchemaConfigContainer } from './styles';
import { useStore } from '@/stores';
import { AutocompleteElement, FormContainer, SelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';

const top100Films = [
  { title: 'The Shawshank Redemption', year: 1994 },
  { title: 'The Godfather', year: 1972 },
  { title: 'The Godfather: Part II', year: 1974 },
  { title: 'The Dark Knight', year: 2008 },
  { title: '12 Angry Men', year: 1957 },
  { title: "Schindler's List", year: 1993 },
  { title: 'Pulp Fiction', year: 1994 },
];

function ConfigDrawer() {
  const { graphtypeStore } = useStore();
  const { schemaStore } = graphtypeStore;
  const open = Boolean(schemaStore?.activeItem);
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);
  const form = useForm({
    defaultValues: {
      name: '',
      labels: [],
    },
  });

  return (
    <SchemaConfigContainer open={open}>
      {open && (
        <>
          <ActionsContainer>
            <Button variant="outlined" color="primary" startIcon={<ContentCopyFilled fontSize="medium" />}>
              <Typography color="primary">{t('duplicate', { ns: 'graphtype' })}</Typography>
            </Button>
            <Button
              variant="outlined"
              color="error"
              sx={{ marginLeft: theme.spacing(1) }}
              startIcon={<DeleteOutline color="error" fontSize="medium" />}
            >
              <Typography color="error">{t('delete', { ns: 'graphtype' })}</Typography>
            </Button>
          </ActionsContainer>
          <NodeTypeInfoContainer>
            <Typography sx={{ mb: theme.spacing(2) }}>{t('nodeType', { ns: 'graphtype' })}</Typography>
            <FormContainer formContext={form}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={12}>
                  <TextFieldElement
                    size="small"
                    label={t('nodeTypeName', { ns: 'graphtype' })}
                    required
                    name="graphType"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} md={12}>
                  <AutocompleteElement
                    name="labels"
                    label={t('label', { ns: 'graphtype' })}
                    multiple
                    options={top100Films}
                    autocompleteProps={{
                      limitTags: 2,
                      size: 'small',
                      getOptionLabel: (option) => option.title,
                      fullWidth: true,
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={12}>
                  <SelectElement
                    label={t('primaryKey', { ns: 'graphtype' })}
                    name="primaryKey"
                    options={[
                      {
                        id: 1,
                        label: 'id',
                      },
                    ]}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
              <Divider />
            </FormContainer>
          </NodeTypeInfoContainer>
        </>
      )}
    </SchemaConfigContainer>
  );
}

export default observer(ConfigDrawer);
