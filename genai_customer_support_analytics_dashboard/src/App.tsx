import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SimpleLogin from './components/Auth/SimpleLogin';
import { OAuthCallback } from './components/OAuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import AgentOverview from './components/Dashboard/AgentOverview';
import ResponsibleAI from './components/Compliance/ResponsibleAI';
import UsersPage from './components/Users/UsersPage';
import {
  ListViewerWrapper,
  ConversationListWrapper,
  TranscriptListWrapper,
  AnalysisCoachingPageWrapper,
  EnhancedCoachingDashboardWrapper
} from './components/Routes/RouteWrappers';
import { useAuth } from './context/AuthContext';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import MainLayout from './components/Layout/MainLayout';

function App() {
  const { user, loading } = useAuth();
  const { agents, conversations, coachingInsights, transcripts, metrics } = useAnalyticsData();

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
          /* If authenticated, show individual routes with layout */
          <Route path="/*" element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/coaching" element={<EnhancedCoachingDashboardWrapper />} />
                <Route path="/call-recordings" element={<ListViewerWrapper />} />
                <Route path="/conversations" element={<ConversationListWrapper conversations={conversations} />} />
                <Route path="/transcripts" element={<TranscriptListWrapper transcripts={transcripts} />} />
                <Route path="/analysis-coaching" element={<AnalysisCoachingPageWrapper />} />
                <Route path="/agents" element={<AgentOverview agents={agents} />} />
                <Route path="/compliance" element={<ResponsibleAI />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          } />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
