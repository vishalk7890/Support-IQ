import React, { useState } from 'react';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import Sidebar from './components/Layout/Sidebar';
import LoadingScreen from './components/Layout/LoadingScreen';
import MetricsGrid from './components/Dashboard/MetricsGrid';
import RealtimeChart from './components/Dashboard/RealtimeChart';
import AgentOverview from './components/Dashboard/AgentOverview';
import ConversationList from './components/Conversations/ConversationList';
import TranscriptList from './components/Transcripts/TranscriptList';
import CoachingInsights from './components/Coaching/CoachingInsights';
import ResponsibleAI from './components/Compliance/ResponsibleAI';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { agents, conversations, coachingInsights, transcripts, metrics, loading } = useAnalyticsData();

  if (loading) {
    return <LoadingScreen />;
  }

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              GenAI Customer Support Analytics Hub
            </h1>
            <p className="text-gray-600">
              Real-time conversation analysis, agent coaching, and performance insights powered by Amazon Bedrock
            </p>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
