import React from 'react';
import { TrendingUp, TrendingDown, Clock, MessageCircle, Target, AlertTriangle, Star, FileText, Mic } from 'lucide-react';
import { PerformanceMetrics } from '../../types';

interface MetricsGridProps {
  metrics: PerformanceMetrics;
}

// Helper function to format time display
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  const metricCards = [
    {
      title: 'Total Conversations',
      value: metrics.totalConversations,
      icon: MessageCircle,
      color: 'bg-green-500',
      change: '+8%',
      positive: true
    },
    {
      title: 'Transcripts Processed',
      value: metrics.transcriptsProcessed,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+15%',
      positive: true
    },
    {
      title: 'Avg Customer Rating',
      value: metrics.avgCustomerRating,
      icon: Star,
      color: 'bg-yellow-500',
      change: '+0.3',
      positive: true,
      suffix: '/5'
    },
    {
      title: 'Resolution Rate',
      value: `${metrics.resolutionRate}%`,
      icon: Target,
      color: 'bg-emerald-500',
      change: '+3.2%',
      positive: true
    },
    {
      title: 'Avg Sentiment Score',
      value: metrics.avgSentimentScore,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      change: '+0.15',
      positive: true
    },
    {
      title: 'Agent Talk Time',
      value: `${Math.round(metrics.avgTalkTimeRatio * 100)}%`,
      icon: Mic,
      color: 'bg-orange-500',
      change: '-2%',
      positive: true
    },
    {
      title: 'Avg Interruptions',
      value: metrics.avgInterruptionCount,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-0.5',
      positive: true
    },
    {
      title: 'Avg Response Time',
      value: formatTime(metrics.avgResponseTime),
      icon: Clock,
      color: 'bg-cyan-500',
      change: '-15s',
      positive: true
    },
    {
      title: 'Escalation Rate',
      value: `${metrics.escalationRate}%`,
      icon: AlertTriangle,
      color: 'bg-rose-500',
      change: '-1.8%',
      positive: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        const ChangeIcon = metric.positive ? TrendingUp : TrendingDown;
        
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                <ChangeIcon size={16} />
                <span>{metric.change}</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}{metric.suffix || ''}
              </h3>
              <p className="text-gray-600 text-sm">{metric.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricsGrid;
