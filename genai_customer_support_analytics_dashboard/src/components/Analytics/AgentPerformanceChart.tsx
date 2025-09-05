import React from 'react';
import { Star, Phone, Clock } from 'lucide-react';

interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  totalCalls: number;
  avgConfidence: number;
  avgDuration: number;
  performanceScore: number;
}

interface AgentPerformanceChartProps {
  data: AgentPerformanceData[];
}

const AgentPerformanceChart: React.FC<AgentPerformanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No agent performance data available</p>
        </div>
      </div>
    );
  }

  // Take top 8 performers for better visualization
  const topAgents = data.slice(0, 8);
  const maxScore = Math.max(...topAgents.map(agent => agent.performanceScore));

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 70) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (score >= 55) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (score >= 70) return { text: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (score >= 55) return { text: 'Average', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'Needs Improvement', color: 'text-red-600 bg-red-100' };
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {topAgents.map((agent, index) => {
        const widthPercentage = (agent.performanceScore / maxScore) * 100;
        const badge = getPerformanceBadge(agent.performanceScore);
        
        return (
          <div 
            key={agent.agentId} 
            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
          >
            {/* Agent Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                  index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
                  'bg-gradient-to-r from-blue-400 to-blue-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{agent.agentName}</h4>
                  <p className="text-xs text-gray-500">Agent ID: {agent.agentId.slice(0, 8)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                  {badge.text}
                </span>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {agent.performanceScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="mb-3">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getPerformanceColor(agent.performanceScore)} transition-all duration-1000`}
                  style={{ 
                    width: `${widthPercentage}%`,
                    transition: 'width 1s ease-in-out'
                  }}
                ></div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">{agent.totalCalls}</div>
                  <div className="text-gray-500">Calls</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {(agent.avgConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-gray-500">Confidence</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-orange-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    {formatDuration(agent.avgDuration)}
                  </div>
                  <div className="text-gray-500">Avg Duration</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {data.length > 8 && (
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Showing top 8 of {data.length} agents
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentPerformanceChart;
