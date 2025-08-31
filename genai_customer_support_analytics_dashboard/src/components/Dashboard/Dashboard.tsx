import React from 'react';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import Sidebar from '../Layout/Sidebar';
import LoadingScreen from '../Layout/LoadingScreen';
import HeaderLogout from '../Layout/HeaderLogout';
import MetricsGrid from './MetricsGrid';
import RealtimeChart from './RealtimeChart';
import AgentOverview from './AgentOverview';
import ConversationList from '../Conversations/ConversationList';
import TranscriptList from '../Transcripts/TranscriptList';
import CoachingInsights from '../Coaching/CoachingInsights';
import ResponsibleAI from '../Compliance/ResponsibleAI';
import UsersPage from '../Users/UsersPage';
import ListViewer from '../List/ListViewer';
import { ApiExample } from '../ApiExample';
import TokenDebugger from '../Auth/TokenDebugger';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const { agents, conversations, coachingInsights, transcripts, metrics, loading } = useAnalyticsData();

  if (loading) return <LoadingScreen />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {metrics && <MetricsGrid metrics={metrics} />}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RealtimeChart />
              </div>
              <div>
                <AgentOverview agents={agents} />
              </div>
            </div>
          </div>
        );
      case 'agents':
        return <AgentOverview agents={agents} />;
      case 'conversations':
        return <ConversationList conversations={conversations} />;
      case 'transcripts':
        return <TranscriptList transcripts={transcripts} />;
      case 'list':
        return <ListViewer />;
      case 'coaching':
        return <CoachingInsights insights={coachingInsights} />;
      case 'compliance':
        return <ResponsibleAI />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <RealtimeChart />
            {metrics && <MetricsGrid metrics={metrics} />}
          </div>
        );
      case 'users':
        return <UsersPage />;
      case 'api-test':
        return <ApiExample />;
      case 'token-debug':
        return <TokenDebugger />;
      default:
        return (
          <div className="space-y-6">
            {metrics && <MetricsGrid metrics={metrics} />}
            <RealtimeChart />
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">GenAI Customer Support Analytics Hub</h1>
              <p className="text-gray-600">Real-time conversation analysis, agent coaching, and insights</p>
            </div>
            <HeaderLogout />
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


