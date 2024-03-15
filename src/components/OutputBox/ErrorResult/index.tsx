import { ConsoleResult } from '@/interfaces/console';
import Box from '@mui/material/Box';

export default function ErrorResult({ result }: { result: ConsoleResult }) {
  const { message } = result;
  return <Box sx={{ p: 2, color: ({ palette }) => palette.vesoft.status4 }}>{message}</Box>;
}
