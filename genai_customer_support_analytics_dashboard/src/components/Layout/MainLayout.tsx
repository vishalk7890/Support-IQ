import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import HeaderLogout from './HeaderLogout';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map routes to active tab for sidebar
  const getActiveTabFromPath = (pathname: string): string => {
    if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
    if (pathname === '/analytics') return 'analytics';
    if (pathname === '/coaching') return 'coaching';
    if (pathname === '/call-recordings') return 'list';
    if (pathname === '/conversations') return 'conversations';
    if (pathname === '/transcripts') return 'transcripts';
    if (pathname === '/analysis-coaching') return 'analysis-coaching';
    if (pathname === '/agents') return 'agents';
    if (pathname === '/compliance') return 'compliance';
    if (pathname === '/users') return 'users';
    if (pathname === '/api-test') return 'api-test';
    if (pathname === '/token-debug') return 'token-debug';
    return 'dashboard';
  };

  // Map tab names to routes for navigation
  const navigateToTab = (tab: string) => {
    const routeMap: { [key: string]: string } = {
      dashboard: '/dashboard',
      analytics: '/analytics',
      coaching: '/coaching',
      list: '/call-recordings',
      conversations: '/conversations',
      transcripts: '/transcripts',
      'analysis-coaching': '/analysis-coaching',
      agents: '/agents',
      compliance: '/compliance',
      users: '/users',
      'api-test': '/api-test',
      'token-debug': '/token-debug'
    };
    
    const route = routeMap[tab] || '/dashboard';
    navigate(route);
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={navigateToTab} />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">GenAI Customer Support Analytics Hub</h1>
              <p className="text-gray-600">Real-time conversation analysis, agent coaching, and insights</p>
            </div>
            <HeaderLogout />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
