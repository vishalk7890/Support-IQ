import React from 'react';
import { Conversation } from '../../types';
import { MessageSquare, Phone, Mail, Clock, TrendingUp, TrendingDown, AlertTriangle, Activity, ArrowRight, Headphones } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  onNavigate?: (tab: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, onNavigate }) => {
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'chat': return MessageSquare;
      case 'voice': return Phone;
      case 'email': return Mail;
      default: return MessageSquare;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'neutral': return 'text-yellow-600 bg-yellow-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'escalated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg text-white p-6">
        {/* Workflow Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Phone className="w-4 h-4" />
              <span>Call Recordings</span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/60" />
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
              <Activity className="w-4 h-4" />
              <span className="font-medium">Live Monitor</span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/60" />
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Headphones className="w-4 h-4" />
              <span>Analysis & Coaching</span>
            </div>
          </div>
          <div className="text-xs text-center text-white/70">
            📶 You are here: Live conversation monitoring stage
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8" />
              Live Monitor
            </h1>
            <p className="text-green-100 mt-1">Real-time conversation monitoring and instant insights</p>
          </div>
          {onNavigate && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('list')}
                className="bg-blue-600/80 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                Call Recordings
              </button>
              <button
                onClick={() => onNavigate('transcripts')}
                className="bg-purple-600/80 hover:bg-purple-600 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <Headphones className="w-4 h-4" />
                Deep Analysis
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Conversations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="text-green-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Conversations</h3>
                <p className="text-sm text-gray-500">Real-time conversation monitoring and analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Monitoring
            </div>
          </div>
        </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Channel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Insights
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {conversations.slice(0, 10).map((conversation) => {
              const ChannelIcon = getChannelIcon(conversation.channel);
              
              return (
                <tr key={conversation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {conversation.id.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500">{conversation.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ChannelIcon size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-900 capitalize">{conversation.channel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
                      {conversation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSentimentColor(conversation.sentiment)}`}>
                        {conversation.sentiment}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({conversation.sentimentScore.toFixed(2)})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      {formatDuration(conversation.duration)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getPriorityColor(conversation.priority)}`}>
                      {conversation.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {conversation.upsellOpportunity && (
                        <TrendingUp size={16} className="text-green-500" title="Upsell Opportunity" />
                      )}
                      {conversation.sentimentScore < -0.5 && (
                        <AlertTriangle size={16} className="text-red-500" title="Negative Sentiment Alert" />
                      )}
                      {conversation.sentiment === 'positive' && (
                        <TrendingUp size={16} className="text-blue-500" title="Positive Interaction" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default ConversationList;
