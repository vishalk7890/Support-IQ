import React from 'react';
import { useAuth } from '../../context/AuthContext';

const HeaderLogout: React.FC = () => {
  const { logout } = useAuth();
  return (
    <button
      onClick={() => logout().then(() => (window.location.href = '/login'))}
      className="inline-flex items-center rounded-lg bg-slate-800 text-white px-3 py-1.5 text-sm shadow hover:bg-slate-900"
    >
      Logout
    </button>
  );
};

export default HeaderLogout;



