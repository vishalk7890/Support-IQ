import React from 'react';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import LoadingScreen from '../Layout/LoadingScreen';
import MetricsGrid from './MetricsGrid';
import RealtimeChart from './RealtimeChart';
const Dashboard: React.FC = () => {
  const { metrics, loading } = useAnalyticsData();

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      {metrics && <MetricsGrid metrics={metrics} />}
      <RealtimeChart />
    </div>
  );
};

export default Dashboard;


