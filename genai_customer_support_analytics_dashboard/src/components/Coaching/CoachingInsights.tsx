import React from 'react';
import { CoachingInsight } from '../../types';
import { Brain, TrendingUp, AlertTriangle, Award, Clock, Target, Heart, MessageCircle } from 'lucide-react';

interface CoachingInsightsProps {
  insights: CoachingInsight[];
}

const CoachingInsights: React.FC<CoachingInsightsProps> = ({ insights }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'improvement': return AlertTriangle;
      case 'praise': return Award;
      case 'training': return Brain;
      default: return MessageCircle;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tone': return Heart;
      case 'response_time': return Clock;
      case 'resolution': return Target;
      case 'upsell': return TrendingUp;
      case 'empathy': return Heart;
      default: return MessageCircle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'text-orange-600 bg-orange-100';
      case 'praise': return 'text-green-600 bg-green-100';
      case 'training': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Brain className="text-blue-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Coaching Insights</h3>
            <p className="text-sm text-gray-500">Personalized feedback and improvement recommendations</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid gap-4">
          {insights.map((insight) => {
            const TypeIcon = getTypeIcon(insight.type);
            const CategoryIcon = getCategoryIcon(insight.category);
            
            return (
              <div key={insight.id} className={`border-l-4 ${getPriorityColor(insight.priority)} bg-gray-50 p-4 rounded-r-lg`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={18} className="text-gray-600" />
                      <CategoryIcon size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(insight.type)}`}>
                          {insight.type}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          {insight.category.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-medium ${
                          insight.priority === 'high' ? 'text-red-600' :
                          insight.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {insight.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{insight.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Agent: {insight.agentId.slice(0, 8)}...</span>
                        <span>Conversation: {insight.conversationId.slice(0, 8)}...</span>
                        <span>{new Date(insight.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  {insight.actionable && (
                    <button className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {insights.length === 0 && (
          <div className="text-center py-8">
            <Brain className="mx-auto text-gray-400 mb-3" size={48} />
            <h4 className="text-gray-600 font-medium mb-2">No insights available</h4>
            <p className="text-gray-500 text-sm">AI coaching insights will appear here as conversations are analyzed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachingInsights;
