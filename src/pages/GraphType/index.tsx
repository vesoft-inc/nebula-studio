import { Box, Container, useTheme } from '@mui/material';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BreadCrumbs } from '@vesoft-inc/ui-components';
import { useTranslation } from 'react-i18next';
import GraphTypeBuilder from './GraphTypeBuilder';
import DraftList from './DraftList';

function GraphType() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const paths = location.pathname.split('/').filter((path) => path.length > 0);
  const { t } = useTranslation(['route', 'common']);

  const pathI18nMap = {
    graphtype: t('graphtype', { ns: 'route' }),
    create: t('create', { ns: 'route' }),
    draft: t('draft', { ns: 'route' }),
  };

  return (
    <Container maxWidth="xl" sx={{ pt: theme.spacing(4) }}>
      <BreadCrumbs
        onBack={() => {
          navigate('/graphtype');
        }}
        items={paths.map((item, index) => ({
          name: pathI18nMap[item as keyof typeof pathI18nMap],
          href: `/${paths.slice(0, index + 1).join('/')}`,
        }))}
      />
      <Box marginTop={theme.spacing(4)}>
        <Routes>
          <Route path="create" element={<GraphTypeBuilder mode="create" />} />
          <Route path="draft" element={<DraftList />} />
          <Route path="manage/:graphType" element={<GraphTypeBuilder mode="edit" />} />
        </Routes>
      </Box>
    </Container>
  );
}

export default GraphType;
