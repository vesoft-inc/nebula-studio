import { Box, Container, useTheme } from '@mui/material';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BreadCrumbs } from '@vesoft-inc/ui-components';
import CreateGraphType from './CreateGraphType';
import GraphTypeDraftList from './GraphTypeDraftList';
import { useTranslation } from 'react-i18next';

function GraphType() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const paths = location.pathname.split('/').filter((path) => path.length > 0);
  const { t } = useTranslation(['route', 'common']);
  return (
    <Container maxWidth="xl" sx={{ pt: theme.spacing(4) }}>
      <BreadCrumbs
        onBack={() => {
          navigate(-1);
        }}
        items={paths.map((item, index) => ({
          // @ts-ignore
          name: t(`graphtype.${item}`, { ns: 'route' }),
          href: `/${paths.slice(0, index + 1).join('/')}`,
        }))}
      />
      <Box marginTop={theme.spacing(4)}>
        <Routes>
          <Route path="create" element={<CreateGraphType />} />
          <Route path="draft" element={<GraphTypeDraftList />} />
        </Routes>
      </Box>
    </Container>
  );
}

export default GraphType;
