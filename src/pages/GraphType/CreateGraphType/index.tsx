import { Button, ButtonGroup, Container, Grid, TextField } from '@mui/material';
import { Stepper } from '@vesoft-inc/ui-components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import { CheckboxElement, FormContainer, TextFieldElement, useForm } from 'react-hook-form-mui';

import { useStore } from '@/stores';
import {
  ActionContainer,
  ContentContainer,
  CreateGraphContainer,
  FooterContainer,
  MainContainer,
  StepContainer,
  TableContainer,
} from './styles';
import VisualBuilder from './VisualBuilder';
import NodeTypeTable from './NodeType';
import EdgeTypeTable from './EdgeType';
import Preview from './Preview';
import { IEdgeTypeItem, INodeTypeItem } from '@/interfaces';

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
  // {
  //   name: 'Label',
  //   type: CreateFunction.Label,
  // },
  // {
  //   name: 'Index',
  //   type: CreateFunction.Index,
  // },
];

function CreateGraphType() {
  const { t } = useTranslation(['graphtype']);
  const [curStep, setCurStep] = useState<CreateGraphTypeStep>(CreateGraphTypeStep.create);
  const { graphtypeStore } = useStore();
  const [curTab, setCurTab] = useState<CreateFunction>(CreateFunction.VisiualBuilder);

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
    form.handleSubmit(() => {
      setCurStep(curStep + 1);
    })();
  };

  const handlePreviousClick = () => {
    setCurStep(curStep - 1);
  };

  const getNgql = () => {
    const { graphTypeName, ifNotExists } = form.getValues();
    const nodeTypeList = graphtypeStore.schemaStore?.nodeTypeList || [];
    const edgeTypeList = graphtypeStore.schemaStore?.edgeTypeList || [];
    const getNodeTypeNgql = (nodeType: INodeTypeItem) => {
      let label = '';
      if (nodeType.labels.length > 0) {
        label += nodeType.labels.length > 1 ? 'LABELS ' : 'LABEL ';
        label += nodeType.labels.map((label) => `${label}`).join('&');
      }
      let property = ``;
      if (nodeType.properties.length > 0) {
        property += `{${nodeType.properties.map((property) => `${property.name} ${property.type} ${property.isPrimaryKey ? 'PRIMARY KEY' : ''}`)}}`;
      }
      return `(${nodeType.name} ${label} ${property})`;
    };
    const getEdgeTypeNgql = (edgeType: IEdgeTypeItem) => {
      let label = '';
      if (edgeType.labels.length > 0) {
        label += edgeType.labels.length > 1 ? 'LABELS ' : 'LABEL ';
        label += edgeType.labels.map((label) => `${label}`).join('&');
      }
      let property = ``;
      if (edgeType.properties.length > 0) {
        property += `{${edgeType.properties.map((property) => `${property.name} ${property.type} ${property.isPrimaryKey ? 'PRIMARY KEY' : ''}`)}}`;
      }
      return `(${edgeType.srcNode.name}) -> [${edgeType.name} ${label} ${property}] -> (${edgeType.dstNode.name})`;
    };
    const ngql = `CREATE GRAPH TYPE ${ifNotExists ? 'IF NOT EXISTS' : ''} ${graphTypeName} AS {
  ${nodeTypeList
    .map((nodeType) => getNodeTypeNgql(nodeType))
    .concat(edgeTypeList.map((edgeType) => getEdgeTypeNgql(edgeType)))
    .join(',\n  ')}
}`;
    return ngql;
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
      <MainContainer>
        <ActionContainer sx={{ mb: 2 }}>
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
                  component={(props) => <TextField {...props} disabled={curStep === CreateGraphTypeStep.preview} />}
                />
              </Grid>
              <Grid item xs={4}>
                <CheckboxElement
                  disabled={curStep === CreateGraphTypeStep.preview}
                  label={t('ifNotExsits', { ns: 'graphtype' })}
                  name="ifNotExists"
                />
              </Grid>
            </Grid>
          </FormContainer>
        </ActionContainer>
        <StepContainer display={curStep === CreateGraphTypeStep.create ? 'block' : 'none'}>
          <Container maxWidth="md" sx={{ justifyContent: 'center', display: 'flex', mb: 2 }}>
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
          <CreateGraphContainer display={curTab === CreateFunction.VisiualBuilder ? 'block' : 'none'}>
            <VisualBuilder />
          </CreateGraphContainer>
          {curTab === CreateFunction.NodeTyppe && (
            <TableContainer>
              <NodeTypeTable />
            </TableContainer>
          )}
          {curTab === CreateFunction.EdgeType && (
            <TableContainer>
              <EdgeTypeTable />
            </TableContainer>
          )}
        </StepContainer>
        {curStep === CreateGraphTypeStep.preview && <Preview ngql={getNgql()} />}
      </MainContainer>
      <FooterContainer>
        {curStep === CreateGraphTypeStep.preview && (
          <Button variant="text" sx={{ mr: '10px', width: '120px' }} onClick={handeNextClick}>
            {t('saveAsDraft', { ns: 'graphtype' })}
          </Button>
        )}
        <Button
          disabled={curStep === CreateGraphTypeStep.create}
          variant="outlined"
          onClick={handlePreviousClick}
          sx={{ width: '120px' }}
        >
          {t('previous', { ns: 'graphtype' })}
        </Button>
        {curStep === CreateGraphTypeStep.create && (
          <Button variant="contained" sx={{ ml: '10px', width: '120px' }} onClick={handeNextClick}>
            {t('preview', { ns: 'graphtype' })}
          </Button>
        )}
        {curStep === CreateGraphTypeStep.preview && (
          <Button variant="contained" sx={{ ml: '10px', minWidth: '120px' }} onClick={handeNextClick}>
            {t('createGraphType', { ns: 'graphtype' })}
          </Button>
        )}
      </FooterContainer>
    </ContentContainer>
  );
}

export default observer(CreateGraphType);
