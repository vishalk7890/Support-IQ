import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Play, 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MessageCircle, 
  Mic, 
  Eye, 
  Phone, 
  Activity, 
  Headphones, 
  ArrowRight,
  RefreshCw,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { useListService, ListItem } from '../../services/listService';
import { useAuthenticatedRequest } from '../../hooks/useApiClient';

interface AnalysisCoachingPageProps {
  onNavigate?: (tab: string) => void;
}

interface ParsedTranscript {
  transcript?: string;
  segments?: Array<{
    text: string;
    start_time?: number;
    end_time?: number;
    speaker?: string;
    confidence?: number;
  }>;
  sentiment?: {
    overall_sentiment?: string;
    confidence?: number;
  };
  speakers?: Array<{
    speaker_label: string;
    speaker_name?: string;
  }>;
  analytics?: {
    talk_time?: { [key: string]: number };
    interruptions?: number;
    sentiment_timeline?: Array<{
      timestamp: number;
      sentiment: string;
      confidence: number;
    }>;
  };
  coaching_insights?: Array<{
    type: string;
    message: string;
    priority: string;
    category: string;
  }>;
}

const AnalysisCoachingPage: React.FC<AnalysisCoachingPageProps> = ({ onNavigate }) => {
  const { getList } = useListService();
  const { makeRequest } = useAuthenticatedRequest();
  
  const [recordings, setRecordings] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<ListItem | null>(null);
  const [transcriptData, setTranscriptData] = useState<ParsedTranscript | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Fetch recordings from API
  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 Fetching recordings for Analysis & Coaching...');
      
      const response = await getList();
      let dataArray: ListItem[];
      
      if (response && typeof response === 'object' && 'Records' in response) {
        dataArray = response.Records;
      } else if (Array.isArray(response)) {
        dataArray = response;
      } else {
        throw new Error('Unexpected data format');
      }
      
      console.log('✅ Fetched', dataArray.length, 'recordings for coaching');
      setRecordings(dataArray);
    } catch (err) {
      console.error('❌ Error fetching recordings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recordings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transcript details
  const fetchTranscriptDetails = async (recording: ListItem) => {
    try {
      setTranscriptLoading(true);
      console.log('📄 Fetching transcript for:', recording.jobName);
      
      const filename = `parsedFiles/${recording.jobName || recording.key || recording.id}.json`;
      const transcriptResponse = await makeRequest(`/get/${encodeURIComponent(filename)}`);
      
      console.log('📄 Transcript data received:', transcriptResponse);
      setTranscriptData(transcriptResponse);
    } catch (err) {
      console.error('❌ Error fetching transcript:', err);
      setTranscriptData(null);
    } finally {
      setTranscriptLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  // Helper functions
  const extractAgentName = (recording: ListItem): string => {
    if (recording.jobName) {
      const agentMatch = recording.jobName.match(/AGENT_([^_]+)/);
      if (agentMatch) return agentMatch[1];
    }
    return 'Unknown Agent';
  };

  const extractDate = (recording: ListItem): Date => {
    if (recording.jobName) {
      const dateMatch = recording.jobName.match(/DT_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
      if (dateMatch) {
        const dateStr = dateMatch[1].replace(/-/g, ':').replace('T', 'T');
        return new Date(dateStr);
      }
    }
    return new Date();
  };

  const formatDuration = (seconds: number | string) => {
    const sec = parseFloat(seconds?.toString() || '0');
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.95) return 'text-green-700 bg-green-100';
    if (confidence > 0.85) return 'text-blue-700 bg-blue-100';
    if (confidence > 0.75) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const generateMockInsights = (recording: ListItem): Array<{type: string, message: string, priority: string, category: string}> => {
    const insights = [];
    const confidence = parseFloat(recording.confidence || '0');
    const duration = parseFloat(recording.duration || '0');
    const agentName = extractAgentName(recording);

    if (confidence > 0.95) {
      insights.push({
        type: 'praise',
        message: `Excellent audio clarity (${(confidence * 100).toFixed(1)}%) - great job with equipment setup!`,
        priority: 'low',
        category: 'technical'
      });
    } else if (confidence < 0.85) {
      insights.push({
        type: 'improvement',
        message: `Audio quality could be improved (${(confidence * 100).toFixed(1)}%) - check microphone positioning`,
        priority: 'medium',
        category: 'technical'
      });
    }

    if (duration < 120) {
      insights.push({
        type: 'praise',
        message: 'Quick resolution time - efficient problem solving!',
        priority: 'low',
        category: 'efficiency'
      });
    } else if (duration > 400) {
      insights.push({
        type: 'training',
        message: 'Long call duration - consider time management techniques',
        priority: 'medium',
        category: 'efficiency'
      });
    }

    insights.push({
      type: 'improvement',
      message: 'Practice active listening techniques to improve customer engagement',
      priority: 'low',
      category: 'communication'
    });

    return insights;
  };

  // Show transcript viewer if recording is selected
  if (selectedRecording) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg text-white p-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setSelectedRecording(null)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              Back to List
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Conversation Analysis</h1>
              <p className="text-purple-100">
                {selectedRecording.jobName?.replace('.wav', '') || 'Unknown Recording'}
              </p>
            </div>
          </div>
        </div>

        {/* Transcript Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {transcriptLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-purple-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading transcript details...</span>
              </div>
            </div>
          ) : transcriptData ? (
            <div className="space-y-6">
              {/* Audio Player Placeholder */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <button className="flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors">
                    <Play size={20} />
                  </button>
                  <div className="flex-1">
                    <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>0:45</span>
                      <span>{formatDuration(selectedRecording.duration || '0')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcript Text */}
              {transcriptData.transcript && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Full Transcript</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {transcriptData.transcript}
                    </p>
                  </div>
                </div>
              )}

              {/* Conversation Timeline */}
              {transcriptData.segments && transcriptData.segments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Conversation Timeline</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcriptData.segments.map((segment, index) => (
                      <div key={index} className="border-l-4 border-purple-200 bg-purple-50 p-4 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm uppercase text-purple-600">
                              {segment.speaker || `Speaker ${index % 2 + 1}`}
                            </span>
                            {segment.start_time && (
                              <span className="text-xs text-gray-500">
                                {formatDuration(segment.start_time)} - {formatDuration(segment.end_time || segment.start_time + 10)}
                              </span>
                            )}
                          </div>
                          {segment.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(segment.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coaching Insights */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Coaching Insights</h3>
                <div className="space-y-3">
                  {generateMockInsights(selectedRecording).map((insight, index) => (
                    <div key={index} className={`border-l-4 bg-gray-50 p-4 rounded-r-lg ${
                      insight.priority === 'high' ? 'border-red-500' :
                      insight.priority === 'medium' ? 'border-yellow-500' :
                      'border-green-500'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2">
                          {insight.type === 'praise' ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : insight.type === 'improvement' ? (
                            <AlertTriangle size={18} className="text-orange-600" />
                          ) : (
                            <Brain size={18} className="text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              insight.type === 'praise' ? 'text-green-600 bg-green-100' :
                              insight.type === 'improvement' ? 'text-orange-600 bg-orange-100' :
                              'text-blue-600 bg-blue-100'
                            }`}>
                              {insight.type}
                            </span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">
                              {insight.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-gray-600 font-medium mb-2">No transcript data available</h3>
              <p className="text-gray-500 text-sm">
                The transcript file may still be processing or unavailable.
              </p>
              <button
                onClick={() => fetchTranscriptDetails(selectedRecording)}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg text-white p-6">
        {/* Workflow Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Phone className="w-4 h-4" />
              <span>Call Recordings</span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/60" />
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Activity className="w-4 h-4" />
              <span>Live Monitor</span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/60" />
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
              <Headphones className="w-4 h-4" />
              <span className="font-medium">Analysis & Coaching</span>
            </div>
          </div>
          <div className="text-xs text-center text-white/70">
            🔍 You are here: Deep insights & coaching stage
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Headphones className="h-8 w-8" />
              Analysis & Coaching
            </h1>
            <p className="text-purple-100 mt-1">AI-powered transcript analysis with agent coaching insights</p>
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
                onClick={() => onNavigate('conversations')}
                className="bg-green-600/80 hover:bg-green-600 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <Activity className="w-4 h-4" />
                Live Monitor
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Recordings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-purple-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Conversation Analysis</h3>
                <p className="text-sm text-gray-500">Deep insights, sentiment analysis, and coaching opportunities</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                {recordings.length} Recordings
              </div>
              <button
                onClick={fetchRecordings}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-purple-600">
              <RefreshCw className="animate-spin" size={20} />
              <span>Loading recordings for analysis...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800 mb-2">
                <AlertTriangle size={20} />
                <span className="font-semibold">Error Loading Data</span>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchRecordings}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-12">
            <Headphones className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-gray-600 font-medium mb-2">No recordings available</h3>
            <p className="text-gray-500 text-sm">Recordings will appear here once they're processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recording
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
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
                {recordings.map((recording, index) => {
                  const confidence = parseFloat(recording.confidence || '0');
                  const duration = parseFloat(recording.duration || '0');
                  const agentName = extractAgentName(recording);
                  const recordingDate = extractDate(recording);

                  return (
                    <motion.tr 
                      key={recording.jobName || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Mic size={16} className="text-purple-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {recording.jobName?.replace('.wav', '') || 'Unknown Recording'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {recordingDate.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{agentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(confidence)}`}>
                          {(confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{formatDuration(duration)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{recording.lang || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-green-700 bg-green-100">
                          Ready
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedRecording(recording);
                            fetchTranscriptDetails(recording);
                          }}
                          className="flex items-center gap-2 px-3 py-1 text-sm text-purple-600 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors"
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisCoachingPage;
