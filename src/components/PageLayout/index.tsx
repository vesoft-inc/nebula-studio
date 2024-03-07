import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import { MainContentContainer } from './styles';
import PageHeader from '@/components/PageHeader';

export default function PageLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <Box sx={{ display: 'flex' }}>
        <MainContentContainer>
          <Outlet />
        </MainContentContainer>
      </Box>
    </Box>
  );
}
