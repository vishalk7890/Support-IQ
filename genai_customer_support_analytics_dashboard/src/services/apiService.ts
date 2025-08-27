import { useAuthenticatedRequest } from '../hooks/useApiClient';

const API_BASE_URL = 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod';

// Types for API responses
export interface TranscriptionJob {
  id: string;
  status: string;
  createdAt: string;
  fileName?: string;
  duration?: number;
  speakerCount?: number;
}

export interface AnalyticsData {
  totalCalls: number;
  averageCallDuration: number;
  totalAgents: number;
  satisfactionScore: number;
  trends?: {
    callVolume: Array<{ date: string; count: number }>;
    satisfaction: Array<{ date: string; score: number }>;
  };
}

export interface SpeakerAnalytics {
  speakerId: string;
  name?: string;
  totalCalls: number;
  averageDuration: number;
  satisfactionScore: number;
  sentimentScore: number;
  keyTopics: string[];
}

export interface CallMetrics {
  callId: string;
  duration: number;
  speakerCount: number;
  sentimentScore: number;
  satisfactionScore: number;
  keyTopics: string[];
  timestamp: string;
  agentId?: string;
}

// Custom hook for API service
export const useApiService = () => {
  const { makeRequest, isReady } = useAuthenticatedRequest();

  const getTranscriptionJobs = async (): Promise<TranscriptionJob[]> => {
    if (!isReady) throw new Error('API client not ready');
    
    const response = await makeRequest<TranscriptionJob[]>(`${API_BASE_URL}/jobs`, {
      method: 'GET',
    });
    
    return Array.isArray(response) ? response : [];
  };

  const getAnalyticsData = async (): Promise<AnalyticsData> => {
    if (!isReady) throw new Error('API client not ready');
    
    const response = await makeRequest<AnalyticsData>(`${API_BASE_URL}/analytics`, {
      method: 'GET',
    });
    
    return response;
  };

  const getSpeakerAnalytics = async (): Promise<SpeakerAnalytics[]> => {
    if (!isReady) throw new Error('API client not ready');
    
    const response = await makeRequest<SpeakerAnalytics[]>(`${API_BASE_URL}/analytics/speakers`, {
      method: 'GET',
    });
    
    return Array.isArray(response) ? response : [];
  };

  const getCallMetrics = async (): Promise<CallMetrics[]> => {
    if (!isReady) throw new Error('API client not ready');
    
    const response = await makeRequest<CallMetrics[]>(`${API_BASE_URL}/analytics/metrics`, {
      method: 'GET',
    });
    
    return Array.isArray(response) ? response : [];
  };

  return {
    getTranscriptionJobs,
    getAnalyticsData,
    getSpeakerAnalytics,
    getCallMetrics,
    isReady,
  };
};
