import {
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  IconButton,
  List,
  Stack,
  Typography,
  createFilterOptions,
  type FilterOptionsState,
} from '@mui/material';
import {
  AutocompleteElement,
  FormContainer,
  TextFieldElement,
  useForm,
  SelectElement,
  useWatch,
  CheckboxElement,
} from 'react-hook-form-mui';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { TransitionGroup } from 'react-transition-group';

import { NodeTypeInfoContainer, PropertyBodyCell, PropertyHeaderCell } from './styles';
import { INodeTypeItem, IProperty } from '@/interfaces';
import { PropertyDataType } from '@/utils/constant';
import { CloseFilled, AddFilled } from '@vesoft-inc/icons';
import { getDuplicateValues } from '@/utils';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores';

interface NodeTypeConfigFormProps {
  form: ReturnType<typeof useForm<INodeTypeItem>>;
}

const labelOptionFilter = createFilterOptions<string>();

function NodeTypeConfigForm(props: NodeTypeConfigFormProps) {
  const { form } = props;
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);

  const { schemaStore } = useStore().graphtypeStore;

  const handleAddProperty = () => {
    const properties = form.getValues('properties') as IProperty[];
    form.setValue(
      'properties',
      properties.concat([
        new IProperty({
          name: '',
          type: PropertyDataType.STRING,
        }),
      ])
    );
  };

  const handleDelete = (index: number) => () => {
    const properties = form.getValues('properties') as IProperty[];
    form.setValue(
      'properties',
      properties.filter((_, i) => i !== index)
    );
  };

  const properties = useWatch({
    control: form.control,
    name: 'properties',
    defaultValue: [],
  });

  const selectedLabelOptions = useWatch({
    control: form.control,
    name: 'labels',
    defaultValue: [],
  });

  const getLabelOptions = (): string[] => {
    return schemaStore?.labelOptions.filter((label) => !selectedLabelOptions.includes(label)) || [];
  };

  return (
    <Box maxHeight={600} sx={{ overflowY: 'auto' }}>
      <FormContainer formContext={form}>
        <NodeTypeInfoContainer>
          <Typography sx={{ mb: theme.spacing(2) }}>{t('nodeType', { ns: 'graphtype' })}</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={12}>
              <TextFieldElement
                size="small"
                label={t('nodeTypeName', { ns: 'graphtype' })}
                required
                name="name"
                fullWidth
              />
            </Grid>
            <Grid item xs={6} md={12}>
              <AutocompleteElement
                name="labels"
                label={t('label', { ns: 'graphtype' })}
                multiple
                options={getLabelOptions()}
                rules={{
                  required: true,
                  validate: (values: string[]) => {
                    const duplicateValues = getDuplicateValues(values);
                    return duplicateValues.length ? `Duplicate: ${duplicateValues.join(', ')}` : true;
                  },
                }}
                autocompleteProps={{
                  limitTags: 2,
                  size: 'small',
                  fullWidth: true,
                  onChange: (_, values: string[]) => {
                    form.setValue('labels', values);
                  },
                  handleHomeEndKeys: true,
                  filterOptions: (options: string[], params: FilterOptionsState<string>) => {
                    const filtered = labelOptionFilter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option);
                    if (inputValue !== '' && !isExisting) {
                      filtered.push(inputValue);
                    }
                    return filtered;
                  },
                }}
              />
            </Grid>
          </Grid>
        </NodeTypeInfoContainer>
        <Divider />
        <NodeTypeInfoContainer>
          <Typography sx={{ mb: theme.spacing(2) }}>{t('properties', { ns: 'graphtype' })}</Typography>
          <Stack direction="row" sx={{ mt: 1 }}>
            <PropertyHeaderCell>
              <Typography>{t('propName', { ns: 'graphtype' })}</Typography>
            </PropertyHeaderCell>
            <PropertyHeaderCell>
              <Typography>{t('propType', { ns: 'graphtype' })}</Typography>
            </PropertyHeaderCell>
            <PropertyHeaderCell>
              <Typography>{t('primaryKey', { ns: 'graphtype' })}</Typography>
            </PropertyHeaderCell>
          </Stack>
          <List>
            <TransitionGroup>
              {properties.map((property, index) => (
                <Collapse key={property.id} sx={{ mb: 2.5 }}>
                  <Stack direction="row" sx={{ mt: 1 }}>
                    <PropertyBodyCell>
                      <TextFieldElement
                        required
                        size="small"
                        fullWidth
                        label={t('propName', { ns: 'graphtype' })}
                        validation={{
                          required: 'Required',
                          validate: (value) => {
                            return form.getValues('properties').find((p, i) => i !== index && p.name === value)
                              ? 'Duplicate'
                              : true;
                          },
                        }}
                        name={`properties.${index}.name`}
                      >
                        {property.name}
                      </TextFieldElement>
                    </PropertyBodyCell>
                    <PropertyBodyCell>
                      <SelectElement
                        name={`properties.${index}.type`}
                        label={t('propType', { ns: 'graphtype' })}
                        required
                        options={Object.values(PropertyDataType).map((type) => ({ label: type }))}
                        valueKey="label"
                        labelKey="label"
                        size="small"
                        fullWidth
                      />
                    </PropertyBodyCell>
                    <PropertyBodyCell display="flex" justifyContent="space-between">
                      <CheckboxElement name={`properties.${index}.isPrimaryKey`} />
                      <IconButton onClick={handleDelete(index)}>
                        <CloseFilled />
                      </IconButton>
                    </PropertyBodyCell>
                  </Stack>
                </Collapse>
              ))}
            </TransitionGroup>
            <Box width="100%" justifyContent="center" display="flex">
              <Button onClick={handleAddProperty} variant="text" startIcon={<AddFilled fontSize="medium" />}>
                {t('addProperty', { ns: 'graphtype' })}
              </Button>
            </Box>
          </List>
        </NodeTypeInfoContainer>
      </FormContainer>
    </Box>
  );
}

export default observer(NodeTypeConfigForm);
