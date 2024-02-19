import { Routes, Route, Navigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import Welcome from '@/pages/Welcome';
import Login from '@/pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<PageLayout />}>
        <Route path="welcome" element={<Welcome />} />
        <Route path="*" element={<Navigate replace to="welcome" />} />
      </Route>
    </Routes>
  );
}
