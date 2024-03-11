import { Button, Container } from '@mui/material';
import { CheckboxElement, Form, Stepper, TextFieldElement } from '@vesoft-inc/ui-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionContainer, ContentContainer, FooterContainer, MainContainer } from './styles';
import Canvas from './Canvas';

enum CreateGraphTypeStep {
  create,
  preview,
}

function CreateGraphType() {
  const { t } = useTranslation(['graphtype']);
  const [curStep, setCurStep] = useState<CreateGraphTypeStep>(CreateGraphTypeStep.create);

  const form = Form.useForm({
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
        <Form
          form={form}
          layout={{
            rowSpacing: 2,
            columnSpacing: 3,
          }}
          FormProps={{
            style: {
              width: '100%',
            },
          }}
        >
          <Form.Item
            label={t('graphTypeName', { ns: 'graphtype' })}
            name="graphTypeName"
            required
            layout={{
              xs: 4,
            }}
          >
            <TextFieldElement size="small" sx={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label={t('ifNotExsits', { ns: 'graphtype' })}
            name="ifNotExists"
            layout={{
              xs: 4,
            }}
            required
          >
            <CheckboxElement />
          </Form.Item>
        </Form>
      </ActionContainer>
      <MainContainer>
        <Canvas />
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

export default CreateGraphType;
