import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a spinner
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;



