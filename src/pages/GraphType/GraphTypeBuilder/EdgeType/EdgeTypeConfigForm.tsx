import { useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  IconButton,
  List,
  MenuItem,
  Stack,
  Typography,
  createFilterOptions,
  type FilterOptionsState,
  Popover,
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
import { IEdgeTypeItem, ILabelItem, INodeTypeItem, IProperty } from '@/interfaces';
import { EdgeDirectionType, MultiEdgeKeyMode, PropertyDataType } from '@/utils/constant';
import { getDuplicateValues } from '@/utils';
import { useStore } from '@/stores';
import ColorPicker from '@/components/ColorPicker';
import { ColorBox } from '../VisualBuilder/styles';

interface EdgeTypeConfigFormProps {
  form: ReturnType<typeof useForm<IEdgeTypeItem>>;
  hasSrcAndDstNode?: boolean;
  colorPicker?: boolean;
}

const labelOptionFilter = createFilterOptions<string>();

function EdgeTypeConfigForm(props: EdgeTypeConfigFormProps) {
  const { form, hasSrcAndDstNode, colorPicker } = props;
  const theme = useTheme();
  const { t } = useTranslation(['graphtype']);
  const { schemaStore } = useStore().graphtypeStore;
  const nodeTypeList = schemaStore?.nodeTypeList;

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

  const getLabelOptions = (): string[] => {
    return schemaStore?.edgeTypeLabelList.filter((label) => !selectedLabelOptions?.includes(label)) || [];
  };

  const directionOptions = useMemo(
    () => [
      {
        label: '------------>',
        value: EdgeDirectionType.Forward,
      },
      {
        label: '-------------',
        value: EdgeDirectionType.Undirected,
      },
      {
        label: '<------------',
        value: EdgeDirectionType.Backword,
      },
    ],
    []
  );

  const multiKeyModeOptions = useMemo(
    () => [
      {
        label: t('multiKeyMode_none', { ns: 'graphtype' }),
        value: MultiEdgeKeyMode.None,
      },
      {
        label: t('multiKeyMode_auto', { ns: 'graphtype' }),
        value: MultiEdgeKeyMode.Auto,
      },
      {
        label: t('multiKeyMode_customize', { ns: 'graphtype' }),
        value: MultiEdgeKeyMode.Customize,
      },
    ],
    []
  );

  const getDirectionOptions = useCallback(() => {
    const { srcNode, dstNode } = form.getValues();
    return [
      {
        label: `${srcNode?.name} -> ${dstNode?.name}`,
        value: EdgeDirectionType.Forward,
      },
      {
        label: `${srcNode?.name} - ${dstNode?.name}`,
        value: EdgeDirectionType.Undirected,
      },
      {
        label: `${srcNode?.name} <- ${dstNode?.name}`,
        value: EdgeDirectionType.Backword,
      },
    ];
  }, []);

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'edge-color-picker',
  });

  const edgeStrokeColor = useWatch({
    control: form.control,
    name: 'style.strokeColor',
  });

  const curMultiEdgeKeyMode = useWatch({
    control: form.control,
    name: 'multiEdgeKeyMode',
  });

  return (
    <Box minHeight={600} sx={{ overflowY: 'auto' }}>
      <FormContainer formContext={form}>
        <TypeInfoContainer>
          <Typography sx={{ mb: theme.spacing(2) }}>{t('edgeType', { ns: 'graphtype' })}</Typography>
          <Grid container rowSpacing={3}>
            <Grid item xs={6} md={12}>
              <TextFieldElement
                size="small"
                label={t('edgeTypeName', { ns: 'graphtype' })}
                required
                name="name"
                fullWidth
              />
            </Grid>
            {hasSrcAndDstNode && (
              <Grid item xs={6} md={12}>
                <TextFieldElement
                  fullWidth
                  select
                  size="small"
                  label={t('direction', { ns: 'graphtype' })}
                  name="direction"
                  onChange={(e) => {
                    const value = e.target.value as unknown as EdgeDirectionType;
                    form.setValue('direction', value);
                  }}
                >
                  {getDirectionOptions().map((option, index) => (
                    <MenuItem key={index} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextFieldElement>
              </Grid>
            )}
            <Grid item xs={6} md={12} sx={{ display: hasSrcAndDstNode ? 'none' : undefined }}>
              <Grid container columnSpacing={2}>
                <Grid item md={4}>
                  <SelectElement
                    size="small"
                    label={t('srcNodeType', { ns: 'graphtype' })}
                    required
                    options={nodeTypeList || []}
                    labelKey="name"
                    objectOnChange
                    onChange={(item: INodeTypeItem) => {
                      form.setValue('srcNode', item);
                    }}
                    valueKey="id"
                    name="srcNode"
                    fullWidth
                  />
                </Grid>
                <Grid item md={4}>
                  <SelectElement
                    size="small"
                    label={t('direction', { ns: 'graphtype' })}
                    options={directionOptions}
                    labelKey="label"
                    valueKey="value"
                    required
                    name="direction"
                    fullWidth
                  />
                </Grid>
                <Grid item md={4}>
                  <SelectElement
                    size="small"
                    label={t('dstNodeType', { ns: 'graphtype' })}
                    options={nodeTypeList || []}
                    labelKey="name"
                    valueKey="id"
                    objectOnChange
                    onChange={(item: INodeTypeItem) => {
                      form.setValue('dstNode', item);
                    }}
                    required
                    name="dstNode"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>
            {colorPicker && (
              <Grid item xs={6} md={12}>
                <Box {...bindFocus(popupState)} width="100%">
                  <TextFieldElement
                    label={t('color', { ns: 'graphtype' })}
                    InputProps={{
                      startAdornment: <ColorBox sx={{ backgroundColor: edgeStrokeColor }} />,
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
                    color={edgeStrokeColor}
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
                options={getLabelOptions()}
                rules={{
                  required: false,
                  validate: (values: ILabelItem[]) => {
                    const duplicateValues = getDuplicateValues<ILabelItem>(values);
                    return duplicateValues.length ? `Duplicate: ${duplicateValues.join(', ')}` : true;
                  },
                }}
                autocompleteProps={{
                  limitTags: 2,
                  size: 'small',
                  fullWidth: true,
                  onChange: (_, values: ILabelItem[]) => {
                    form.setValue(
                      'labels',
                      values.map((option) => {
                        if (typeof option === 'string') {
                          return option;
                        }
                        return option.name;
                      })
                    );
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
            <Grid item xs={6} md={12}>
              <SelectElement
                fullWidth
                label={t('multiKeyMode', { ns: 'graphtype' })}
                size="small"
                name="multiEdgeKeyMode"
                options={multiKeyModeOptions}
                labelKey="label"
                valueKey="value"
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
            {curMultiEdgeKeyMode === MultiEdgeKeyMode.Customize && (
              <PropertyHeaderCell>
                <Typography>{t('multiEdgeKey', { ns: 'graphtype' })}</Typography>
              </PropertyHeaderCell>
            )}
          </Stack>
          <List>
            <TransitionGroup>
              {properties?.map((property, index) => (
                <Collapse key={property.id} sx={{ mb: 2.5 }}>
                  <Stack direction="row">
                    <PropertyBodyCell>
                      <TextFieldElement
                        required
                        size="small"
                        fullWidth
                        label={t('propName', { ns: 'graphtype' })}
                        validation={{
                          required: true,
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
                        options={Object.values(PropertyDataType).map((type) => ({ label: type }))}
                        valueKey="label"
                        labelKey="label"
                        size="small"
                        fullWidth
                      />
                    </PropertyBodyCell>
                    {curMultiEdgeKeyMode === MultiEdgeKeyMode.Customize && (
                      <PropertyBodyCell display="flex" justifyContent="space-between">
                        <CheckboxElement name={`properties.${index}.multiEdgeKey`} />
                        <IconButton onClick={handleDelete(index)}>
                          <CloseFilled />
                        </IconButton>
                      </PropertyBodyCell>
                    )}
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

export default observer(EdgeTypeConfigForm);
