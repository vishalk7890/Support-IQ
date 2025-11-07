import React, { useState, useEffect, useRef } from 'react';
import { Transcript } from '../../types';
import { ArrowLeft, Play, Pause, Clock, Users, TrendingUp, TrendingDown, Star, Brain, MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { useTranscriptService } from '../../services/transcriptService';

interface TranscriptViewerProps {
  transcript: Transcript;
  onBack: () => void;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcript: initialTranscript, onBack }) => {
  const [transcript, setTranscript] = useState<Transcript>(initialTranscript);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { refreshTranscript } = useTranscriptService();

  // Update transcript when initial transcript changes
  useEffect(() => {
    setTranscript(initialTranscript);
  }, [initialTranscript]);

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Audio playback failed:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Update current time
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const updateTime = () => setCurrentTime(Math.floor(audio.currentTime));
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const updated = await refreshTranscript(transcript.id);
    if (updated) {
      setTranscript(updated);
    }
    setIsRefreshing(false);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp size={16} className="text-green-600" />;
      case 'negative': return <TrendingDown size={16} className="text-red-600" />;
      default: return <MessageCircle size={16} className="text-yellow-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'border-l-green-500 bg-green-50';
      case 'negative': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-yellow-500 bg-yellow-50';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to List
          </button>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Conversation Transcript</h3>
            <p className="text-sm text-gray-500">ID: {transcript.id}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Audio Controls */}
        {transcript.audioUrl && (
          <div className="space-y-3">
            <audio 
              ref={audioRef}
              src={transcript.audioUrl}
              onTimeUpdate={(e) => setCurrentTime(Math.floor((e.target as HTMLAudioElement).currentTime))}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex-1">
                <div className="w-full bg-gray-300 rounded-full h-2 cursor-pointer" onClick={(e) => {
                  if (audioRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    const duration = transcript.segments[transcript.segments.length - 1]?.endTime || 0;
                    audioRef.current.currentTime = percent * duration;
                  }
                }}>
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(currentTime / (transcript.segments[transcript.segments.length - 1]?.endTime || 1)) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(transcript.segments[transcript.segments.length - 1]?.endTime || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 p-6">
        {/* Transcript Content */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Conversation Timeline</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transcript.segments.map((segment, index) => (
              <div
                key={segment.id}
                className={`border-l-4 p-4 rounded-r-lg ${getSentimentColor(segment.sentiment)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`font-medium text-sm uppercase ${
                      segment.speaker === 'agent' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {segment.speaker}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </span>
                    {getSentimentIcon(segment.sentiment)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(segment.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-gray-700">{segment.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-6">
          {/* Overall Sentiment */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Overall Analysis</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sentiment</span>
                <div className="flex items-center gap-2">
                  {getSentimentIcon(transcript.sentimentAnalysis.overall.sentiment)}
                  <span className="text-sm font-medium capitalize">
                    {transcript.sentimentAnalysis.overall.sentiment}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Score</span>
                <span className="text-sm font-medium">{transcript.sentimentAnalysis.overall.score}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence</span>
                <span className="text-sm font-medium">
                  {Math.round(transcript.sentimentAnalysis.overall.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Agent Performance */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Agent Performance</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Empathy Score</span>
                <span className="text-sm font-medium">{transcript.sentimentAnalysis.agent.empathyScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Professionalism</span>
                <span className="text-sm font-medium">{transcript.sentimentAnalysis.agent.professionalismScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Talk Time</span>
                <span className="text-sm font-medium">{Math.round(transcript.talkTimeRatio.agent * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Interruptions</span>
                <span className="text-sm font-medium">{transcript.interruptionCount}</span>
              </div>
            </div>
          </div>

          {/* Customer Rating */}
          {transcript.customerRating && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Customer Feedback</h5>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {renderStars(transcript.customerRating)}
                  <span className="text-lg font-bold text-gray-900">{transcript.customerRating}/5</span>
                </div>
                {transcript.customerFeedback && (
                  <div className="text-sm text-gray-700 italic">
                    "{transcript.customerFeedback}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Phrases */}
          <div className="bg-green-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Key Phrases</h5>
            <div className="flex flex-wrap gap-2">
              {transcript.keyPhrases.map((phrase, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full"
                >
                  {phrase}
                </span>
              ))}
            </div>
          </div>

          {/* Customer Satisfaction Indicators */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Customer Indicators</h5>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-600 uppercase tracking-wider">Satisfaction</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {transcript.sentimentAnalysis.customer.satisfactionIndicators.map((indicator, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full"
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
              {transcript.sentimentAnalysis.customer.frustrationIndicators.length > 0 && (
                <div>
                  <span className="text-xs text-gray-600 uppercase tracking-wider">Concerns</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {transcript.sentimentAnalysis.customer.frustrationIndicators.map((indicator, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full"
                      >
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;
