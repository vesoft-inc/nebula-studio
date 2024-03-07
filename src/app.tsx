import { Routes, Route, Navigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import Welcome from '@/pages/Welcome';
import Console from '@/pages/Console';
import Login from '@/pages/Login';
import GrapyTypeList from '@/pages/GrapyTypeList';
import Importer from '@/pages/Importer';
// import CreateGraphType from '@/pages/GraphType/CreateGraphType';
// import GraphTypeDraftList from '@/pages/GraphType/GraphTypeDraftList';
import GraphType from '@/pages/GraphType';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<PageLayout />}>
        <Route path="welcome" element={<Welcome />} />
        <Route path="console" element={<Console />} />
        <Route path="graphTypeList" element={<GrapyTypeList />} />
        <Route path="graphType/*" element={<GraphType />} />
        <Route path="importer" element={<Importer />} />
        <Route path="*" element={<Navigate replace to="console" />} />
      </Route>
    </Routes>
  );
}
