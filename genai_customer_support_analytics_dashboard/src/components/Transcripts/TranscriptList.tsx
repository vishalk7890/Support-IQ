import React, { useState } from 'react';
import { Transcript } from '../../types';
import { FileText, Play, Clock, Users, TrendingUp, TrendingDown, Star, MessageCircle, Mic, Eye, Phone, Activity, Headphones, ArrowRight } from 'lucide-react';
import TranscriptViewer from './TranscriptViewer';

interface TranscriptListProps {
  transcripts: Transcript[];
  onNavigate?: (tab: string) => void;
}

const TranscriptList: React.FC<TranscriptListProps> = ({ transcripts, onNavigate }) => {
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-yellow-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (selectedTranscript) {
    return (
      <TranscriptViewer 
        transcript={selectedTranscript} 
        onBack={() => setSelectedTranscript(null)} 
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Conversation Transcripts</h3>
            <p className="text-sm text-gray-500">AI-powered transcript analysis with sentiment and coaching insights</p>
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
                Agent Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentiment Analysis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Talk Time Ratio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transcripts.map((transcript) => (
              <tr key={transcript.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Mic size={16} className="text-blue-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transcript.id.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(transcript.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {transcript.segments.length} segments
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Empathy:</span>
                      <span className="text-sm font-medium">{transcript.sentimentAnalysis.agent.empathyScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Professional:</span>
                      <span className="text-sm font-medium">{transcript.sentimentAnalysis.agent.professionalismScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{transcript.interruptionCount} interruptions</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className={`flex items-center gap-1 ${getSentimentColor(transcript.sentimentAnalysis.overall.sentiment)}`}>
                      {transcript.sentimentAnalysis.overall.sentiment === 'positive' ? (
                        <TrendingUp size={16} />
                      ) : transcript.sentimentAnalysis.overall.sentiment === 'negative' ? (
                        <TrendingDown size={16} />
                      ) : (
                        <MessageCircle size={16} />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {transcript.sentimentAnalysis.overall.sentiment}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Score: {transcript.sentimentAnalysis.overall.score}
                    </div>
                    <div className="text-xs text-gray-500">
                      Confidence: {Math.round(transcript.sentimentAnalysis.overall.confidence * 100)}%
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      {renderStars(transcript.customerRating || 0)}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {transcript.customerRating}/5
                    </div>
                    {transcript.customerFeedback && (
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        "{transcript.customerFeedback}"
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users size={12} className="text-blue-500" />
                      <span className="text-xs text-gray-600">Agent: {Math.round(transcript.talkTimeRatio.agent * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={12} className="text-green-500" />
                      <span className="text-xs text-gray-600">Customer: {Math.round(transcript.talkTimeRatio.customer * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${transcript.talkTimeRatio.agent * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProcessingStatusColor(transcript.processingStatus)}`}>
                    {transcript.processingStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setSelectedTranscript(transcript)}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TranscriptList;
