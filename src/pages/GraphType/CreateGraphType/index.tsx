import { Button, Container, Grid } from '@mui/material';
import { Stepper } from '@vesoft-inc/ui-components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import { CheckboxElement, FormContainer, TextFieldElement, useForm } from 'react-hook-form-mui';

import { useStore } from '@/stores';
import { ActionContainer, ContentContainer, FooterContainer, MainContainer } from './styles';
import SchemaEditor from './SchemaEditor';

enum CreateGraphTypeStep {
  create,
  preview,
}

function CreateGraphType() {
  const { t } = useTranslation(['graphtype']);
  const [curStep, setCurStep] = useState<CreateGraphTypeStep>(CreateGraphTypeStep.create);
  const { graphtypeStore } = useStore();

  useEffect(() => {
    graphtypeStore.initSchemaStore();
    console.log('initSchemaStore');
    return () => {
      graphtypeStore.destroySchemaStore();
      console.log('destroySchemaStore');
    };
  }, []);

  const form = useForm({
    defaultValues: {
      graphTypeName: '',
      ifNotExists: true,
    },
  });

  const handeNextClick = () => {
    setCurStep(curStep + 1);
  };

  const handlePreviousClick = () => {
    setCurStep(curStep - 1);
  };

  return (
    <ContentContainer>
      <Container maxWidth="md">
        <Stepper
          activeStep={curStep}
          items={[
            {
              name: t('createGraphType', { ns: 'graphtype' }),
            },
            {
              name: t('preview', { ns: 'graphtype' }),
            },
          ]}
        />
      </Container>
      <ActionContainer>
        <FormContainer
          formContext={form}
          FormProps={{
            style: {
              width: '100%',
            },
          }}
        >
          <Grid container rowSpacing={2} columnSpacing={3}>
            <Grid item xs={4}>
              <TextFieldElement
                label={t('graphTypeName', { ns: 'graphtype' })}
                name="graphTypeName"
                required
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <CheckboxElement label={t('ifNotExsits', { ns: 'graphtype' })} required name="ifNotExists" />
            </Grid>
          </Grid>
        </FormContainer>
      </ActionContainer>
      <MainContainer>
        <SchemaEditor />
      </MainContainer>
      <FooterContainer>
        <Button
          disabled={curStep === CreateGraphTypeStep.create}
          variant="outlined"
          onClick={handlePreviousClick}
          sx={{ width: '120px' }}
        >
          {t('previous', { ns: 'graphtype' })}
        </Button>
        <Button
          disabled={curStep === CreateGraphTypeStep.preview}
          variant="contained"
          sx={{ ml: '10px', width: '120px' }}
          onClick={handeNextClick}
        >
          {t('next', { ns: 'graphtype' })}
        </Button>
      </FooterContainer>
    </ContentContainer>
  );
}

export default observer(CreateGraphType);
