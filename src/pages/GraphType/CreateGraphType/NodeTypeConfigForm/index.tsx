import { Button, Collapse, Divider, Grid, IconButton, List, Stack, Typography } from '@mui/material';
import {
  AutocompleteElement,
  FormContainer,
  TextFieldElement,
  useForm,
  SelectElement,
  FieldValues,
  Path,
  PathValue,
} from 'react-hook-form-mui';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { TransitionGroup } from 'react-transition-group';

import { NodeTypeInfoContainer } from './styles';
import { IProperty } from '@/interfaces';
import { PropertyDataType } from '@/utils/constant';
import { useMemo, useState } from 'react';
import { CloseFilled, AddFilled } from '@vesoft-inc/icons';

const top100Films = [
  { title: 'The Shawshank Redemption', year: 1994 },
  { title: 'The Godfather', year: 1972 },
  { title: 'The Godfather: Part II', year: 1974 },
  { title: 'The Dark Knight', year: 2008 },
  { title: '12 Angry Men', year: 1957 },
  { title: "Schindler's List", year: 1993 },
  { title: 'Pulp Fiction', year: 1994 },
];

const PROPERTY_PREFIX = '$property_';

interface NodeTypeConfigFormProps<T extends FieldValues> {
  form: ReturnType<typeof useForm<T>>;
}

function NodeTypeConfigForm<T extends FieldValues>(props: NodeTypeConfigFormProps<T>) {
  const { form } = props;
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);
  const [propertyNum, setPropertyNum] = useState<number>(0);

  const properties = useMemo(() => {
    const values = form.getValues();
    const properties: IProperty[] = [];
    const propertyNum = Object.keys(values).filter((key) => key.startsWith(PROPERTY_PREFIX)).length / 2;
    for (let i = 0; i < propertyNum; i++) {
      const name = values[`${PROPERTY_PREFIX}name_${i + 1}`];
      const type = values[`${PROPERTY_PREFIX}type_${i + 1}`];
      properties.push({ name, type });
    }
    return properties;
  }, [form, propertyNum]);

  const handleAddProperty = () => {
    const property: IProperty = {
      name: '',
      type: PropertyDataType.STRING,
    };
    setPropertyNum(propertyNum + 1);
    updatePropertyForm(propertyNum + 1, property);
  };

  const updatePropertyForm = (index: number, property: IProperty) => {
    const namePath = `${PROPERTY_PREFIX}name_${index}` as Path<T>;
    const typePath = `${PROPERTY_PREFIX}type_${index}` as Path<T>;
    form.setValue(namePath, property.name as PathValue<T, Path<T>>);
    form.setValue(typePath, property.type as PathValue<T, Path<T>>);
  };

  const unRegistProperty = (index: number) => {
    const namePath = `${PROPERTY_PREFIX}name_${index + 1}` as Path<T>;
    const typePath = `${PROPERTY_PREFIX}type_${index + 1}` as Path<T>;
    form.unregister(namePath);
    form.unregister(typePath);
  };

  const handleDelete = (index: number) => () => {
    const newProperties = [...properties];
    newProperties.splice(index, 1);
    unRegistProperty(index);
    setPropertyNum(propertyNum - 1);
  };

  return (
    <>
      <FormContainer formContext={form}>
        <NodeTypeInfoContainer>
          <Typography sx={{ mb: theme.spacing(2) }}>{t('nodeType', { ns: 'graphtype' })}</Typography>
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
              <SelectElement label={t('primaryKey', { ns: 'graphtype' })} name="primaryKey" fullWidth size="small" />
            </Grid>
          </Grid>
        </NodeTypeInfoContainer>
        <Divider />
        <NodeTypeInfoContainer>
          <Typography sx={{ mb: theme.spacing(2) }}>{t('properties', { ns: 'graphtype' })}</Typography>
          <List>
            <TransitionGroup>
              {properties.map((property, index) => (
                <Collapse key={index} sx={{ mb: 2.5 }}>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <TextFieldElement
                      required
                      size="small"
                      fullWidth
                      label="Prop Name"
                      name={`${PROPERTY_PREFIX}name_${index + 1}`}
                    >
                      {property.name}
                    </TextFieldElement>
                    <SelectElement
                      name={`${PROPERTY_PREFIX}type_${index + 1}`}
                      label="Prop Type"
                      required
                      options={Object.values(PropertyDataType).map((type) => ({ label: type }))}
                      valueKey="label"
                      labelKey="label"
                      size="small"
                      fullWidth
                    />
                    <IconButton onClick={handleDelete(index)}>
                      <CloseFilled />
                    </IconButton>
                  </Stack>
                </Collapse>
              ))}
            </TransitionGroup>
            <Button onClick={handleAddProperty} variant="text" startIcon={<AddFilled fontSize="medium" />}>
              {t('addProperty', { ns: 'graphtype' })}
            </Button>
          </List>
        </NodeTypeInfoContainer>
        <Button
          onClick={form.handleSubmit(() => {
            console.log('hhh', form.getValues());
          })}
        >
          submit
        </Button>
      </FormContainer>
    </>
  );
}

export default NodeTypeConfigForm;
