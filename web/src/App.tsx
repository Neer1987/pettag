import { Route, Routes } from 'react-router-dom';

import { HomePage, NotFoundPage } from '@/pages/HomePage';
import { PetProfilePage } from '@/pages/PetProfilePage';

import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pet/:slug" element={<PetProfilePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
