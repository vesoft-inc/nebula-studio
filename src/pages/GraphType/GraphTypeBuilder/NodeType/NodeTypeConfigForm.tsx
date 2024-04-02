import {
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  IconButton,
  List,
  Popover,
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
import { usePopupState, bindFocus, bindPopover } from 'material-ui-popup-state/hooks';
import { observer } from 'mobx-react-lite';
import { CloseFilled, AddFilled } from '@vesoft-inc/icons';

import { TypeInfoContainer, PropertyBodyCell, PropertyHeaderCell } from '@/pages/GraphType/GraphTypeBuilder/styles';
import { INodeTypeItem, IProperty } from '@/interfaces';
import { PropertyDataType } from '@/utils/constant';
import { getDuplicateValues } from '@/utils';
import { useStore } from '@/stores';
import ColorPicker from '@/components/ColorPicker';
import { ColorBox } from '../VisualBuilder/styles';

interface NodeTypeConfigFormProps {
  form: ReturnType<typeof useForm<INodeTypeItem>>;
  colorPicker?: boolean;
}

const labelOptionFilter = createFilterOptions<string>();

function NodeTypeConfigForm(props: NodeTypeConfigFormProps) {
  const { form, colorPicker } = props;
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);

  const { schemaStore } = useStore().graphtypeStore;

  const handleAddProperty = () => {
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
  });

  const selectedLabelOptions = useWatch({
    control: form.control,
    name: 'labels',
  });

  const nodeStrokeColor = useWatch({
    control: form.control,
    name: 'style.strokeColor',
  });

  const labelOptions = schemaStore?.nodeTypeLabeList.filter((label) => !selectedLabelOptions?.includes(label)) || [];

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'node-color-picker',
  });

  return (
    <Box minHeight={600} sx={{ overflowY: 'auto' }}>
      <FormContainer formContext={form}>
        <TypeInfoContainer>
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
            {colorPicker && (
              <Grid item xs={6} md={12}>
                <Box {...bindFocus(popupState)} width="100%">
                  <TextFieldElement
                    label={t('color', { ns: 'graphtype' })}
                    InputProps={{
                      startAdornment: <ColorBox sx={{ backgroundColor: nodeStrokeColor }} />,
                    }}
                    name="style.strokeColor"
                    size="small"
                    fullWidth
                  />
                </Box>
                <Popover
                  {...bindPopover(popupState)}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <ColorPicker
                    color={nodeStrokeColor}
                    onChangeComplete={(color) => {
                      form.setValue('style.strokeColor', color);
                      form.setValue('style.fill', `${color}60`);
                    }}
                  />
                </Popover>
              </Grid>
            )}
            <Grid item xs={6} md={12}>
              <AutocompleteElement
                name="labels"
                label={t('label', { ns: 'graphtype' })}
                multiple
                options={labelOptions}
                rules={{
                  required: false,
                  validate: (values: string[]) => {
                    const duplicateValues = getDuplicateValues(values);
                    return duplicateValues.length ? `Duplicate: ${duplicateValues.join(', ')}` : true;
                  },
                }}
                autocompleteProps={{
                  limitTags: 2,
                  size: 'small',
                  fullWidth: true,
                  filterSelectedOptions: true,
                  handleHomeEndKeys: true,
                  freeSolo: true,
                  autoSelect: true,
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
        </TypeInfoContainer>
        <Divider />
        <TypeInfoContainer>
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
              {properties?.map((property, index) => (
                <Collapse key={property.id + index}>
                  <Stack direction="row">
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
        </TypeInfoContainer>
      </FormContainer>
    </Box>
  );
}

export default observer(NodeTypeConfigForm);
