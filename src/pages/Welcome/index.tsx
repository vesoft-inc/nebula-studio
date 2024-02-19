import { observer } from 'mobx-react-lite';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import ProTip from '@/components/ProTip';
import Copyright from '@/components/Copyright';

export default observer(function Welcome() {
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
          <Link to="/login">
            <Button variant="contained">Go to the home page</Button>
          </Link>
        </Box>
        <ProTip />
        <Copyright />
      </Box>
    </Container>
  );
});
