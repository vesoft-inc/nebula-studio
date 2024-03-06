import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { AddFilled, EditFilled } from '@vesoft-inc/icons';
import { useTranslation } from 'react-i18next';

interface IProps {
  name: string;
  graphList: string[];
}

function GrapyTypeList(props: IProps) {
  const { name } = props;

  const { t } = useTranslation(['graphtype', 'common']);

  return (
    <Box>
      <Typography variant="h4" fontSize={16}>
        {name}
      </Typography>
      <Box>
        <Button variant="outlined" sx={{ marginRight: 2 }}>
          <EditFilled />
        </Button>
        <Button startIcon={<AddFilled />} variant="outlined">
          {t('createGraphType', { ns: 'graphtype' })}
        </Button>
      </Box>
    </Box>
  );
}

export default GrapyTypeList;
