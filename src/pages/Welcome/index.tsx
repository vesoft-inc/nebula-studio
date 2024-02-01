import { observer } from 'mobx-react-lite';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ProTip from '@src/components/ProTip';
import Copyright from '@src/components/Copyright';
import { useStore } from '@src/stores';

export default observer(function Welcome() {
  const store = useStore();
  console.log('store', store.commonStore.loading);
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          MUI v5 + Next.js with TypeScript example
        </Typography>
        <Box maxWidth="sm">
          <Button variant="contained">Go to the home page</Button>
        </Box>
        <ProTip />
        <Copyright />
      </Box>
    </Container>
  );
});
