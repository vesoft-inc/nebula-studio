import { Breadcrumbs, Container, Link } from '@mui/material';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import CreateGraphType from './CreateGraphType';
import GraphTypeDraftList from './GraphTypeDraftList';

function GraphType() {
  // const navigate = useNavigate();
  const location = useLocation();
  console.log('location', location.pathname);

  return (
    <Container maxWidth="xl">
      <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit" href="/graphTypeList">
          MUI
        </Link>
        <Link underline="hover" color="inherit" href="/graphType/create">
          create
        </Link>
      </Breadcrumbs>
      <Routes>
        <Route path="create" element={<CreateGraphType />} />
        <Route path="draft" element={<GraphTypeDraftList />} />
        <Route path="*" element={<Navigate replace to="/graphTypeList" />} />
      </Routes>
    </Container>
  );
}

export default GraphType;
