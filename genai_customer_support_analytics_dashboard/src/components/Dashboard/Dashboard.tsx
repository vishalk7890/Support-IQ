import React from 'react';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import LoadingScreen from '../Layout/LoadingScreen';
import MetricsGrid from './MetricsGrid';
import RealtimeChart from './RealtimeChart';
import AgentOverview from './AgentOverview';

const Dashboard: React.FC = () => {
  const { agents, metrics, loading } = useAnalyticsData();

  if (loading) return <LoadingScreen />;

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
};

export default Dashboard;


