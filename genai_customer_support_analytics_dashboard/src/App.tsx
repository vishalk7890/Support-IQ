import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SimpleLogin from './components/Auth/SimpleLogin';
import { OAuthCallback } from './components/OAuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* OAuth callback route - always available */}
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        
        {/* Handle loading state */}
        {loading ? (
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            </div>
          } />
        ) : !user ? (
          /* If not authenticated, show login */
          <Route path="*" element={<SimpleLogin />} />
        ) : (
          /* If authenticated, show dashboard routes */
          <>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
