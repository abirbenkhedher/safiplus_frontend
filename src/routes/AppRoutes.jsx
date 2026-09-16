import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard/Dashboard';

// Ces composants seront créés plus tard
// import Clients from '../pages/Clients/Clients';
// import Reparations from '../pages/Reparations/Reparations';
// etc.

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Routes à ajouter plus tard */}
        {/* <Route path="clients" element={<Clients />} /> */}
        {/* <Route path="reparations" element={<Reparations />} /> */}
        {/* etc. */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;