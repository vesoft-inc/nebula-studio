import { Button, ButtonGroup, Container, Grid, useTheme } from '@mui/material';
import { Stepper } from '@vesoft-inc/ui-components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import { CheckboxElement, FormContainer, TextFieldElement, useForm } from 'react-hook-form-mui';

import { useStore } from '@/stores';
import { ActionContainer, ContentContainer, FooterContainer, MainContainer } from './styles';
import SchemaEditor from './SchemaEditor';
import NodeTypeForm from './NodeTypeTable';

enum CreateGraphTypeStep {
  create,
  preview,
}

enum CreateFunction {
  VisiualBuilder,
  NodeTyppe,
  EdgeType,
  Label,
  Index,
}

const FunctionTabs = [
  {
    name: 'Visiual Builder',
    type: CreateFunction.VisiualBuilder,
  },
  {
    name: 'Node Type',
    type: CreateFunction.NodeTyppe,
  },
  {
    name: 'Edge Type',
    type: CreateFunction.EdgeType,
  },
  {
    name: 'Label',
    type: CreateFunction.Label,
  },
  {
    name: 'Index',
    type: CreateFunction.Index,
  },
];

function CreateGraphType() {
  const { t } = useTranslation(['graphtype']);
  const [curStep, setCurStep] = useState<CreateGraphTypeStep>(CreateGraphTypeStep.create);
  const { graphtypeStore } = useStore();
  const [curTab, setCurTab] = useState<CreateFunction>(CreateFunction.VisiualBuilder);
  const theme = useTheme();

  useEffect(() => {
    graphtypeStore.initSchemaStore();
    return () => {
      graphtypeStore.destroySchemaStore();
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
      <Container maxWidth="md" sx={{ mt: 3 }}>
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
      <Container maxWidth="md" sx={{ justifyContent: 'center', display: 'flex' }}>
        <ButtonGroup size="small">
          {FunctionTabs.map((tab) => (
            <Button
              key={tab.type}
              onClick={() => setCurTab(tab.type)}
              variant={curTab === tab.type ? 'contained' : 'outlined'}
            >
              {tab.name}
            </Button>
          ))}
        </ButtonGroup>
      </Container>
      {curTab === CreateFunction.VisiualBuilder && (
        <MainContainer sx={{ border: `1px solid ${theme.palette.vesoft.bgColor11}` }}>
          <SchemaEditor />
        </MainContainer>
      )}
      {curTab === CreateFunction.NodeTyppe && (
        <MainContainer>
          <NodeTypeForm />
        </MainContainer>
      )}
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
