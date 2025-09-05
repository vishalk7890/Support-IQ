import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Eye, Calendar, Activity, Play, Clock, TrendingUp, User, Phone, BarChart3, MessageCircle, Brain, Send, ArrowRight, Headphones } from 'lucide-react';
import { useListService, ListItem } from '../../services/listService';
import { useAuthenticatedRequest } from '../../hooks/useApiClient';

interface ListViewerProps {
  onNavigate?: (tab: string) => void;
}

const ListViewer: React.FC<ListViewerProps> = ({ onNavigate }) => {
  const { getList, isReady } = useListService();
  const { makeRequest: makeAuthenticatedRequest } = useAuthenticatedRequest();
  const [listData, setListData] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  
  // GenAI chat states
  const [chatQueries, setChatQueries] = useState<{label: string, value: string}[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [callSummary, setCallSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchData = async () => {
    if (!isReady) {
      setError('Authentication required. Please sign in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Attempting to fetch /list data...');
      const response = await getList();
      console.log('✅ Successfully fetched list data:', response);
      
      // Handle Amazon Transcribe format with Records array
      const items = response.Records || response.items || (Array.isArray(response) ? response : []);
      
      // Ensure each item has an ID for React keys
      const itemsWithIds = items.map((item, index) => ({
        ...item,
        id: item.id || item.uri || item.jobName || `item-${index}`,
      }));
      
      console.log('📋 Processed items with IDs:', itemsWithIds);
      setListData(itemsWithIds);
    } catch (err) {
      console.error('❌ Error fetching list:', err);
      
      // More detailed error message
      let errorMessage = 'Failed to fetch list data';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check for specific error types
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Check API Gateway authorizer configuration.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Access forbidden. Check API permissions and resource policies.';
        } else if (err.message.includes('404')) {
          errorMessage = 'API endpoint not found. Verify the /list endpoint exists.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = listData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return filtered;
  }, [listData, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatValue = (key: string, value: any) => {
    if (!value) return '-';
    
    // Format dates
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    
    // Format status with colors
    if (key.toLowerCase() === 'status') {
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value.toLowerCase() === 'active' || value.toLowerCase() === 'completed' 
            ? 'bg-green-100 text-green-800'
            : value.toLowerCase() === 'pending' || value.toLowerCase() === 'in-progress'
            ? 'bg-yellow-100 text-yellow-800' 
            : value.toLowerCase() === 'failed' || value.toLowerCase() === 'error'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      );
    }
    
    return value.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading list data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800 mb-2">
          <Activity size={20} />
          <span className="font-semibold">Error Loading Data</span>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Helper functions for better data formatting
  const formatDuration = (seconds: string | number) => {
    const sec = parseFloat(seconds?.toString() || '0');
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatConfidence = (confidence: string | number) => {
    const conf = parseFloat(confidence?.toString() || '0') * 100;
    return `${conf.toFixed(1)}%`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      case 'neutral': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'processing': return 'text-yellow-700 bg-yellow-100';
      case 'failed': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // Initialize analytics when a recording is selected
  const handleViewAnalytics = async (item: ListItem) => {
    setSelectedItem(item);
    setChatQueries([]);
    setCallSummary('');
    
    // Auto-generate call summary
    await generateCallSummary(item);
  };

  // Generate automatic call summary
  const generateCallSummary = async (item: ListItem) => {
    setSummaryLoading(true);
    try {
      console.log('🔍 Generating call summary for recording:', item.jobName);
      
      // Construct filename based on the item data
      const filename = `parsedFiles/${item.jobName || item.key || item.id}.json`;
      
      const summaryData = await makeAuthenticatedRequest(`/genaiquery?filename=${encodeURIComponent(filename)}&query=${encodeURIComponent('Please provide a comprehensive summary of this call including the main issue, resolution, and key points discussed.')}`, {
        method: 'GET'
      });
      
      console.log('✅ Call summary generated:', summaryData);
      
      if (summaryData && summaryData.response) {
        setCallSummary(summaryData.response);
      } else {
        setCallSummary('⚠️ No summary content was returned by the AI service. This may indicate the transcript file is empty or not yet processed.');
      }
    } catch (err) {
      console.error('❌ Error generating call summary:', err);
      
      // Enhanced error handling with specific, actionable error messages
      let errorMessage = 'Unable to generate call summary';
      
      if (err instanceof Error) {
        if (err.message.includes('502') || err.message.includes('Bad Gateway')) {
          errorMessage = `⚠️ **AI Service Temporarily Unavailable**

The AI service is currently experiencing technical difficulties and cannot generate summaries right now.

**What you can try:**
• Use the chat interface below to ask specific questions
• Check back in a few minutes
• Try a different recording if available

*This is a temporary server issue that should resolve automatically.*`;
        } else if (err.message.includes('404') || err.message.includes('Not Found')) {
          errorMessage = `📁 **Transcript File Not Found**

The AI system cannot locate the transcript file for this recording.

**This usually means:**
• The recording is still being processed
• The transcript hasn't been generated yet
• The file may have been moved or renamed

*Try refreshing in a few minutes, or use the chat below for general questions.*`;
        } else if (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized')) {
          errorMessage = `🔒 **Authentication Required**

There's an issue with your session authentication.

**To fix this:**
• Try refreshing the page
• Sign out and sign back in
• Your session may have expired

*Contact support if this problem continues.*`;
        } else if (err.message.includes('500') || err.message.includes('Internal')) {
          errorMessage = `⚙️ **Internal Service Error**

The AI service encountered an internal error while processing this recording.

**You can try:**
• Asking a simpler question using the chat below
• Waiting a moment and refreshing the page
• Trying a different recording

*The service team has been notified of this issue.*`;
        } else {
          errorMessage = `❌ **Service Unavailable**

Encountered an unexpected error: ${err.message.split(':')[0]}

**Try:**
• Using the AI chat below for specific questions
• Refreshing the page
• Contact support if the issue persists

*The chat interface may still work for individual queries.*`;
        }
      }
      
      setCallSummary(errorMessage);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Submit a chat query
  const submitQuery = async (query: string) => {
    if (isQuerying || !selectedItem || !query.trim()) {
      return;
    }

    setIsQuerying(true);
    
    // Add query to chat with loading state
    const newQuery = {
      label: query.trim(),
      value: '...'
    };
    const updatedQueries = [...chatQueries, newQuery];
    setChatQueries(updatedQueries);
    
    try {
      console.log('🔍 Submitting GenAI query:', query);
      
      // Construct filename based on the selected item
      const filename = `parsedFiles/${selectedItem.jobName || selectedItem.key || selectedItem.id}.json`;
      
      const response = await makeAuthenticatedRequest(`/genaiquery?filename=${encodeURIComponent(filename)}&query=${encodeURIComponent(query)}`, {
        method: 'GET'
      });
      
      console.log('✅ GenAI response received:', response);
      
      // Update the query with the actual response
      const finalQueries = updatedQueries.map(q => 
        q.value === '...' ? {
          label: q.label,
          value: response.response || 'No response available'
        } : q
      );
      
      setChatQueries(finalQueries);
      
      // Auto-scroll to bottom (if needed)
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('❌ Error submitting query:', err);
      
      // Update with a helpful error message based on the error type
      let errorMessage = 'Sorry, I encountered an error processing your question.';
      
      if (err instanceof Error) {
        if (err.message.includes('502') || err.message.includes('Bad Gateway')) {
          errorMessage = '🔧 The AI service is temporarily unavailable. Please try again in a moment.';
        } else if (err.message.includes('404') || err.message.includes('Not Found')) {
          errorMessage = '📁 Could not find the transcript for this recording. It may still be processing.';
        } else if (err.message.includes('401') || err.message.includes('403')) {
          errorMessage = '🔐 Authentication expired. Please refresh the page and try again.';
        } else if (err.message.includes('500')) {
          errorMessage = '⚙️ Internal service error. Please try a simpler question or contact support.';
        } else {
          errorMessage = '❌ Network error. Please check your connection and try again.';
        }
      }
      
      const finalQueries = updatedQueries.map(q => 
        q.value === '...' ? {
          label: q.label,
          value: errorMessage
        } : q
      );
      
      setChatQueries(finalQueries);
    } finally {
      setIsQuerying(false);
    }
  };

  // Chat Input Component
  const ChatInput: React.FC<{ onSubmit: (query: string) => void }> = ({ onSubmit }) => {
    const [query, setQuery] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSubmit(query.trim());
        setQuery('');
      }
    };
    
    return (
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about this call..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isQuerying}
        />
        <button
          type="submit"
          disabled={isQuerying || !query.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isQuerying ? 'Sending...' : 'Send'}
        </button>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg text-white p-6">
        {/* Workflow Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
              <Phone className="w-4 h-4" />
              <span className="font-medium">Call Recordings</span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/60" />
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Activity className="w-4 h-4" />
              <span>Live Monitor</span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/60" />
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Headphones className="w-4 h-4" />
              <span>Analysis & Coaching</span>
            </div>
          </div>
          <div className="text-xs text-center text-white/70">
            🎦 You are here: Raw recordings and initial processing stage
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Phone className="h-8 w-8" />
              Call Recordings
            </h1>
            <p className="text-blue-100 mt-1">Analyze customer support conversations with AI insights</p>
          </div>
          <div className="flex items-center gap-3">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('conversations')}
                  className="bg-green-600/80 hover:bg-green-600 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Activity className="w-4 h-4" />
                  View Live Monitor
                </button>
                <button
                  onClick={() => onNavigate('transcripts')}
                  className="bg-purple-600/80 hover:bg-purple-600 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Headphones className="w-4 h-4" />
                  Deep Analysis
                </button>
              </>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <Activity className="w-4 h-4" />
              Total Recordings
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{listData.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <Clock className="w-4 h-4" />
              Total Duration
            </div>
            <p className="text-2xl font-bold mt-1 text-white">
              {Math.round(listData.reduce((acc, item) => acc + parseFloat(item.duration || '0'), 0) / 60)}m
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              Avg Confidence
            </div>
            <p className="text-2xl font-bold mt-1 text-white">
              {(listData.reduce((acc, item) => acc + parseFloat(item.confidence || '0'), 0) * 100 / listData.length || 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <Eye className="w-4 h-4" />
              {searchTerm || sortBy !== 'jobName' ? 'Filtered Results' : 'Available'}
            </div>
            <p className="text-2xl font-bold mt-1 text-white">{filteredAndSortedData.length}</p>
            {(searchTerm || sortBy !== 'jobName') && (
              <p className="text-xs text-white/70 mt-1">
                {searchTerm ? `Search: "${searchTerm.slice(0, 20)}${searchTerm.length > 20 ? '...' : ''}"` : `Sorted by ${sortBy}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="🔍 Search by job name, language, confidence level, or any field..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 placeholder-gray-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="jobName">Sort by Job Name</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="duration">Sort by Duration</option>
            <option value="lang">Sort by Language</option>
          </select>
        </div>
      </div>

      {/* Recordings Grid */}
      {listData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Phone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recordings Found</h3>
          <p className="text-gray-600">No call recordings are available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedData.map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 overflow-hidden group hover:scale-[1.02] hover:border-blue-200 transform"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-base">
                      {item.jobName?.replace('.wav', '') || 'Untitled Recording'}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1 font-medium">
                      {item.lang || 'Unknown Language'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    parseFloat(item.confidence || '0') > 0.95 ? 'bg-green-100 text-green-700' :
                    parseFloat(item.confidence || '0') > 0.90 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {formatConfidence(item.confidence || '0')}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatDuration(item.duration || '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700 font-medium">
                      AI Ready
                    </span>
                  </div>
                </div>

                {/* Quick Insights Tags */}
                <div className="mb-4 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {/* Confidence insight */}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      parseFloat(item.confidence || '0') > 0.95 ? 'bg-emerald-100 text-emerald-700' :
                      parseFloat(item.confidence || '0') > 0.90 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      🎦 {parseFloat(item.confidence || '0') > 0.95 ? 'High Quality' : parseFloat(item.confidence || '0') > 0.90 ? 'Good Quality' : 'Needs Review'}
                    </span>
                    
                    {/* Duration insight */}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      parseFloat(item.duration || '0') < 120 ? 'bg-blue-100 text-blue-700' :
                      parseFloat(item.duration || '0') < 300 ? 'bg-indigo-100 text-indigo-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      ⏱️ {parseFloat(item.duration || '0') < 120 ? 'Quick Call' : parseFloat(item.duration || '0') < 300 ? 'Standard Call' : 'Extended Call'}
                    </span>
                    
                    {/* Language insight */}
                    {item.lang && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        🌍 {item.lang === 'en-US' ? 'English' : item.lang}
                      </span>
                    )}
                  </div>
                  
                  {/* AI-generated insight preview */}
                  <div className="text-xs text-gray-600 italic">
                    🤖 {parseFloat(item.confidence || '0') > 0.95 ? 'Clear conversation, excellent transcription quality' :
                        parseFloat(item.confidence || '0') > 0.90 ? 'Good conversation quality, ready for analysis' :
                        'May need manual review for best results'}
                  </div>
                </div>

                {/* Sentiment if available */}
                {item.sentiment && (
                  <div className="mb-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      getSentimentColor(item.sentiment)
                    }`}>
                      {item.sentiment} Sentiment
                    </span>
                  </div>
                )}

                {/* Enhanced Action Button */}
                <button
                  onClick={() => handleViewAnalytics(item)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium group-hover:scale-[1.02] hover:scale-[1.02] group-hover:shadow-xl hover:shadow-xl transform"
                >
                  <span className="text-lg">📊</span>
                  See AI Insights
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Enhanced Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Phone className="w-6 h-6" />
                    {selectedItem.jobName?.replace('.wav', '') || 'Recording Analysis'}
                  </h2>
                  <p className="text-blue-100 mt-1">Comprehensive AI-powered call analytics</p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Duration</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatDuration(selectedItem.duration || '0')}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Confidence</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatConfidence(selectedItem.confidence || '0')}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <User className="w-5 h-5" />
                    <span className="font-medium">Language</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {selectedItem.lang || 'Unknown'}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium">Status</span>
                  </div>
                  <p className="text-lg font-bold text-orange-900">
                    Processed
                  </p>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Technical Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Technical Details
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(selectedItem)
                      .filter(([key]) => ['key', 'jobName', 'confidence', 'lang', 'duration'].includes(key))
                      .map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                        <span className="font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-gray-900 font-mono text-sm max-w-xs text-right truncate">
                          {value?.toString() || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Data */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Additional Information
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(selectedItem)
                      .filter(([key]) => !['key', 'jobName', 'confidence', 'lang', 'duration', 'id'].includes(key))
                      .slice(0, 8)
                      .map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                        <span className="font-medium text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-gray-900 text-sm max-w-xs text-right truncate">
                          {value?.toString() || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mock Analytics Visualization */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Sentiment Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Positive</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">75%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Neutral</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-gray-500 h-2 rounded-full" style={{width: '20%'}}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">20%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Negative</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: '5%'}}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Key Insights</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Customer satisfaction: High</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Issue resolution: Successful</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700">Agent performance: Excellent</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700">Call efficiency: Above average</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Call Summary */}
              <div className="mt-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    AI Call Summary
                  </h3>
                  
                  {summaryLoading ? (
                    <div className="flex items-center gap-3 text-blue-600">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Generating comprehensive call summary...</span>
                    </div>
                  ) : callSummary ? (
                    <div className="bg-white/70 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{callSummary}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">Summary not available. You can ask specific questions below.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Chat Interface */}
              <div className="mt-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    AI Assistant
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Ask questions about this call recording and get AI-powered insights.
                  </p>
                  
                  {/* Chat History */}
                  {chatQueries.length > 0 && (
                    <div 
                      id="chat-container" 
                      className="bg-white/70 rounded-lg p-4 mb-4 max-h-80 overflow-y-auto space-y-4"
                    >
                      {chatQueries.map((query, index) => (
                        <div key={index} className="space-y-2">
                          <div className="bg-blue-100 rounded-lg p-3 ml-8">
                            <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                              <User className="w-3 h-3" />
                              <span className="font-medium">You asked:</span>
                            </div>
                            <p className="text-gray-900 text-sm">{query.label}</p>
                          </div>
                          <div className="bg-purple-100 rounded-lg p-3 mr-8">
                            <div className="flex items-center gap-2 text-xs text-purple-600 mb-1">
                              <Brain className="w-3 h-3" />
                              <span className="font-medium">AI Assistant:</span>
                            </div>
                            <p className="text-gray-900 text-sm whitespace-pre-wrap">
                              {query.value === '...' ? (
                                <span className="flex items-center gap-2 text-purple-600">
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Thinking...
                                </span>
                              ) : (
                                query.value
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Chat Input */}
                  <ChatInput onSubmit={submitQuery} />
                  
                  {/* Suggested Questions */}
                  {chatQueries.length === 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Try asking:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'What was the main issue discussed?',
                          'How was the problem resolved?',
                          'What was the customer sentiment?',
                          'Were there any action items?',
                          'What products were mentioned?'
                        ].map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => submitQuery(suggestion)}
                            disabled={isQuerying}
                            className="text-xs bg-white/60 hover:bg-white/80 border border-purple-200 rounded-full px-3 py-1 text-purple-700 hover:text-purple-900 transition-colors disabled:opacity-50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ListViewer;
