import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './user/styles/index.css';
import './user/i18n';

import App from './App.jsx';               // User app
import AppAdmin from './admin/AppAdmin.jsx'; // Admin app

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* USER */}
      <Route path="/*" element={<App />} />

      {/* ADMIN */}
      <Route path="/admin/*" element={<AppAdmin />} />
    </Routes>
  </BrowserRouter>
);
