import { useAuthenticatedRequest } from '../hooks/useApiClient';
import { useState, useCallback } from 'react';
import { Transcript, TranscriptSegment as TypesTranscriptSegment } from '../types';
import { TranscriptSegment as RecordingTranscriptSegment } from './recordingsService';

const API_BASE_URL = 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod';

interface AnalyticsData {
  sentiment?: {
    overall?: number;
    agent?: number;
    customer?: number;
  };
  metrics?: {
    empathy?: number;
    professionalism?: number;
    talkTimeRatio?: {
      agent: number;
      customer: number;
    };
    interruptions?: number;
  };
  keyPhrases?: string[];
  customerRating?: number;
  customerFeedback?: string;
}

/**
 * Transform recording segment to transcript segment
 */
const transformSegment = (segment: RecordingTranscriptSegment, index: number): TypesTranscriptSegment => {
  return {
    id: segment.id || `seg-${index}`,
    speaker: segment.speaker.toLowerCase() === 'agent' ? 'agent' : 'customer',
    text: segment.text,
    startTime: segment.startTime,
    endTime: segment.endTime,
    sentiment: segment.sentiment || 'neutral',
    sentimentScore: 0,
    confidence: segment.confidence || 0.85
  };
};

/**
 * Transform API response to Transcript type
 */
const transformToTranscript = (
  fileKey: string,
  parsedData: any,
  analytics?: AnalyticsData
): Transcript => {
  let segments: TypesTranscriptSegment[] = [];
  
  if (parsedData.segments && Array.isArray(parsedData.segments)) {
    segments = parsedData.segments.map(transformSegment);
  } else if (parsedData.SpeechSegments && Array.isArray(parsedData.SpeechSegments)) {
    segments = parsedData.SpeechSegments.map((seg: any, idx: number) => {
      let speaker = seg.SegmentSpeaker || 'unknown';
      if (speaker === 'spk_0') speaker = 'customer';
      if (speaker === 'spk_1') speaker = 'agent';
      
      const sentiment = seg.SentimentIsPositive === 1 ? 'positive' : 
                       seg.SentimentIsNegative === 1 ? 'negative' : 'neutral';
      
      return {
        id: `seg-${idx}`,
        speaker: speaker as 'agent' | 'customer',
        text: seg.DisplayText || seg.OriginalText || '',
        startTime: seg.SegmentStartTime || 0,
        endTime: seg.SegmentEndTime || 0,
        sentiment: sentiment,
        sentimentScore: sentiment === 'positive' ? 0.7 : sentiment === 'negative' ? -0.7 : 0,
        confidence: 0.85
      };
    });
  }

  const sentimentScores = segments.map(s => s.sentimentScore);
  const avgSentiment = sentimentScores.length > 0 
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
    : 0;
  
  const overallSentiment: 'positive' | 'neutral' | 'negative' = 
    avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral';

  const agentSegments = segments.filter(s => s.speaker === 'agent');
  const customerSegments = segments.filter(s => s.speaker === 'customer');

  const agentTalkTime = agentSegments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  const customerTalkTime = customerSegments.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  const totalTalkTime = agentTalkTime + customerTalkTime;

  const talkTimeRatio = totalTalkTime > 0 ? {
    agent: agentTalkTime / totalTalkTime,
    customer: customerTalkTime / totalTalkTime
  } : { agent: 0.5, customer: 0.5 };

  let interruptions = 0;
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].speaker !== segments[i-1].speaker) {
      const gap = segments[i].startTime - segments[i-1].endTime;
      if (gap < 1) interruptions++;
    }
  }

  const agentSentimentScores = agentSegments.map(s => s.sentimentScore);
  const avgAgentSentiment = agentSentimentScores.length > 0
    ? agentSentimentScores.reduce((a, b) => a + b, 0) / agentSentimentScores.length
    : 0;

  const customerSentimentScores = customerSegments.map(s => s.sentimentScore);
  const avgCustomerSentiment = customerSentimentScores.length > 0
    ? customerSentimentScores.reduce((a, b) => a + b, 0) / customerSentimentScores.length
    : 0;

  const allText = segments.map(s => s.text).join(' ');
  const words = allText.toLowerCase().split(/\s+/);
  const commonWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by'];
  const uniqueWords = [...new Set(words)].filter(w => w.length > 4 && !commonWords.includes(w));
  const keyPhrases = analytics?.keyPhrases || uniqueWords.slice(0, 8);

  const satisfactionIndicators: string[] = [];
  const frustrationIndicators: string[] = [];
  
  if (avgCustomerSentiment > 0.3) {
    satisfactionIndicators.push('satisfied', 'positive experience');
  } else if (avgCustomerSentiment > 0) {
    satisfactionIndicators.push('content');
  }
  
  if (avgCustomerSentiment < -0.3) {
    frustrationIndicators.push('frustrated', 'dissatisfied');
  } else if (avgCustomerSentiment < 0) {
    frustrationIndicators.push('concerned');
  }

  const empathyScore = analytics?.metrics?.empathy || Math.min(1, Math.max(0, 0.7 + avgAgentSentiment * 0.3));
  const professionalismScore = analytics?.metrics?.professionalism || 0.8;

  const customerRating = analytics?.customerRating || Math.max(1, Math.min(5, Math.round(3 + avgCustomerSentiment * 2)));

  const timeline = segments.map(seg => ({
    timestamp: seg.startTime,
    sentiment: seg.sentiment,
    score: seg.sentimentScore
  }));

  const responseLatency: number[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].speaker === 'customer' && segments[i + 1].speaker === 'agent') {
      const latency = segments[i + 1].startTime - segments[i].endTime;
      if (latency > 0) responseLatency.push(latency);
    }
  }

  const fullTranscript = segments.map(s => `[${s.speaker.toUpperCase()}] ${s.text}`).join('\n');

  return {
    id: fileKey,
    conversationId: fileKey.split('_')[1] || fileKey,
    agentId: parsedData.agentId || 'agent-001',
    customerId: parsedData.customerId || 'customer-001',
    audioUrl: parsedData.audioUrl,
    transcriptText: fullTranscript,
    segments,
    sentimentAnalysis: {
      overall: {
        sentiment: overallSentiment,
        score: Number(avgSentiment.toFixed(2)),
        confidence: 0.85
      },
      agent: {
        sentiment: avgAgentSentiment > 0.2 ? 'positive' : avgAgentSentiment < -0.2 ? 'negative' : 'neutral',
        score: Number(avgAgentSentiment.toFixed(2)),
        empathyScore: Number(empathyScore.toFixed(2)),
        professionalismScore: Number(professionalismScore.toFixed(2))
      },
      customer: {
        sentiment: avgCustomerSentiment > 0.2 ? 'positive' : avgCustomerSentiment < -0.2 ? 'negative' : 'neutral',
        score: Number(avgCustomerSentiment.toFixed(2)),
        satisfactionIndicators,
        frustrationIndicators
      },
      timeline
    },
    keyPhrases,
    talkTimeRatio,
    interruptionCount: interruptions,
    responseLatency,
    customerRating,
    customerFeedback: analytics?.customerFeedback,
    createdAt: parsedData.timestamp || new Date().toISOString(),
    processingStatus: 'completed'
  };
};

export const useTranscriptService = () => {
  const { makeRequest, isReady } = useAuthenticatedRequest(API_BASE_URL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllTranscripts = useCallback(async (): Promise<Transcript[]> => {
    if (!isReady) {
      console.warn('⚠️ API client not ready');
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching all transcripts...');

      const response = await makeRequest<{ Records?: any[], parsedFiles?: any[] }>('/list', {
        method: 'GET'
      });

      const records = response.Records || response.parsedFiles || [];
      console.log(`✅ Fetched ${records.length} records`);

      const transcripts: Transcript[] = [];
      
      for (const record of records) {
        try {
          const fileKey = record.key || record.fileKey;
          
          if (fileKey && fileKey.endsWith('.json')) {
            const parsedData = await fetchTranscriptById(fileKey);
            if (parsedData) {
              transcripts.push(parsedData);
            }
          } else {
            const basicTranscript = transformToTranscript(
              record.jobName || record.key || `transcript-${Date.now()}`,
              record
            );
            transcripts.push(basicTranscript);
          }
        } catch (err) {
          console.warn('⚠️ Failed to process record:', record, err);
        }
      }

      transcripts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log(`✅ Successfully processed ${transcripts.length} transcripts`);
      return transcripts;
    } catch (err) {
      console.error('❌ Error fetching transcripts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transcripts';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [makeRequest, isReady]);

  const fetchTranscriptById = useCallback(async (fileKey: string): Promise<Transcript | null> => {
    if (!isReady) {
      console.warn('⚠️ API client not ready');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 Fetching transcript: ${fileKey}`);

      const encodedKey = encodeURIComponent(fileKey);
      const parsedData = await makeRequest<any>(`/get/parsedFiles/${encodedKey}`, {
        method: 'GET'
      });

      console.log('✅ Parsed file data received');

      if (!parsedData.audioUrl) {
        const audioFilename = fileKey.replace(/\.json$/, '').replace(/\.wav$/, '') + '.wav';
        try {
          const presignedResponse = await makeRequest<{ success: boolean; url?: string }>(`/presign?filename=${encodeURIComponent(audioFilename)}`, {
            method: 'GET'
          });
          if (presignedResponse.success && presignedResponse.url) {
            parsedData.audioUrl = presignedResponse.url;
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch audio URL:', err);
        }
      }

      const transcript = transformToTranscript(fileKey, parsedData);
      
      return transcript;
    } catch (err) {
      console.error('❌ Error fetching transcript:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transcript';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [makeRequest, isReady]);

  const refreshTranscript = useCallback(async (transcriptId: string): Promise<Transcript | null> => {
    return fetchTranscriptById(transcriptId);
  }, [fetchTranscriptById]);

  return {
    fetchAllTranscripts,
    fetchTranscriptById,
    refreshTranscript,
    loading,
    error,
    isReady
  };
};

export default useTranscriptService;
