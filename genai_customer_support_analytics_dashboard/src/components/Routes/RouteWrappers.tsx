import React from 'react';
import { useNavigate } from 'react-router-dom';
import ListViewer from '../List/ListViewer';
import ConversationList from '../Conversations/ConversationList';
import TranscriptList from '../Transcripts/TranscriptList';
import AnalysisCoachingPage from '../Coaching/AnalysisCoachingPage';
import EnhancedCoachingDashboard from '../Coaching/EnhancedCoachingDashboard';

// Wrapper for ListViewer with navigation
export const ListViewerWrapper: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (tab: string) => {
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

  return <ListViewer onNavigate={handleNavigate} />;
};

// Wrapper for ConversationList with navigation
export const ConversationListWrapper: React.FC<{ conversations: any[] }> = ({ conversations }) => {
  const navigate = useNavigate();
  
  const handleNavigate = (tab: string) => {
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

  return <ConversationList conversations={conversations} onNavigate={handleNavigate} />;
};

// Wrapper for TranscriptList with navigation
export const TranscriptListWrapper: React.FC<{ transcripts: any[] }> = ({ transcripts }) => {
  const navigate = useNavigate();
  
  const handleNavigate = (tab: string) => {
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

  return <TranscriptList transcripts={transcripts} onNavigate={handleNavigate} />;
};

// Wrapper for AnalysisCoachingPage with navigation
export const AnalysisCoachingPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (tab: string) => {
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

  return <AnalysisCoachingPage onNavigate={handleNavigate} />;
};

// Wrapper for EnhancedCoachingDashboard with navigation
export const EnhancedCoachingDashboardWrapper: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (tab: string) => {
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

  return <EnhancedCoachingDashboard onNavigate={handleNavigate} />;
};
