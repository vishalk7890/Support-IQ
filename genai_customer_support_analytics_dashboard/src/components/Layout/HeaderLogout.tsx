import React from 'react';
import { useAuth } from '../../context/AuthContext';

const HeaderLogout: React.FC = () => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    console.log('🚪 Logging out from Cognito...');
    
    try {
      await logout();
      console.log('✅ Cognito logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };
  
  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center rounded-lg bg-slate-800 text-white px-3 py-1.5 text-sm shadow hover:bg-slate-900"
    >
      Logout
    </button>
  );
};

export default HeaderLogout;



